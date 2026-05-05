const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { auth, validarRol, SECRET_KEY } = require('../middlewares/auth');

// Roles definidos para control de acceso
const ROLES = {
    ADMIN: 1,
    VENDEDOR: 2
};

router.get('/perfil/me', auth, async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT * FROM USUARIOS WHERE id_usuario = ?', [req.usuario.id]);
        
        if (usuarios.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        res.json(usuarios[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

router.put('/perfil/me', auth, async (req, res) => {
    try {
        const { username, telefono, password_actual, password_nueva } = req.body;
        const id_usuario = req.usuario.id;
    
        if (telefono && !/^\d{9}$/.test(telefono)) {
            return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos' });
        }

        const [usuarios] = await pool.query('SELECT * FROM USUARIOS WHERE id_usuario = ?', [id_usuario]);
        const usuario = usuarios[0];

        const esValida = await bcrypt.compare(password_actual, usuario.password_hash);
        if (!esValida) {
            return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
        }

        let passFinal = usuario.password_hash;
        if (password_nueva && password_nueva.trim() !== "") {
            passFinal = await bcrypt.hash(password_nueva, 10);
        }

        await pool.query(
            'UPDATE USUARIOS SET username = ?, telefono = ?, password_hash = ? WHERE id_usuario = ?',
            [username, telefono, passFinal, id_usuario]
        );

        const [usuariosUpd] = await pool.query('SELECT * FROM USUARIOS WHERE id_usuario = ?', [id_usuario]);
        const userUpd = usuariosUpd[0];

        const nuevoToken = jwt.sign(
            { 
                id: userUpd.id_usuario, 
                rol: userUpd.id_rol, 
                nombre: userUpd.nombre,
                username: userUpd.username 
            },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({ 
            mensaje: 'Perfil actualizado correctamente',
            token: nuevoToken 
        });
    } catch (error) {
        console.error("Error en PUT /perfil/me:", error);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
});

router.post('/registro', async (req, res) => {
    try {
        const { id_rol, nombre, apellidos, telefono, correo, username, password } = req.body;

        if (!username || !password || !correo) {
            return res.status(400).json({ error: 'Campos obligatorios faltantes' });
        }

        // Validar rol
        if (![ROLES.ADMIN, ROLES.VENDEDOR].includes(id_rol)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO USUARIOS (id_rol, nombre, apellidos, telefono, correo, username, password_hash) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [resultado] = await pool.query(query, [
            id_rol,
            nombre,
            apellidos,
            telefono,
            correo,
            username,
            password_hash
        ]);

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            id_usuario: resultado.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Usuario o correo ya existen' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Login con JWT
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [usuarios] = await pool.query(
            'SELECT * FROM USUARIOS WHERE username = ?',
            [username]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = usuarios[0];

        const valido = await bcrypt.compare(password, usuario.password_hash);

        if (!valido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Crear token JWT
        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                rol: usuario.id_rol,
                nombre: usuario.nombre,
                username: usuario.username
            },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en login' });
    }
});

// Ruta protegida solo para ADMIN
router.get('/admin', auth, validarRol([ROLES.ADMIN]), (req, res) => {
    res.json({
        mensaje: 'Bienvenido ADMIN',
        usuario: req.usuario
    });
});

// Ruta para ADMIN y VENDEDOR
router.get('/dashboard', auth, validarRol([ROLES.ADMIN, ROLES.VENDEDOR]), (req, res) => {
    res.json({
        mensaje: 'Acceso permitido',
        usuario: req.usuario
    });
});

// 1. Obtener todos los usuarios (Directorio)
router.get('/', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const query = `
            SELECT id_usuario AS id, nombre, apellidos, telefono, correo, username, id_rol AS rol 
            FROM USUARIOS
        `;
        const [usuarios] = await pool.query(query);
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la lista de empleados' });
    }
});

// 2. Editar datos de un empleado (Modal de Edición)
router.put('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, telefono, id_rol } = req.body;

        const query = `
            UPDATE USUARIOS 
            SET nombre = ?, apellidos = ?, telefono = ?, id_rol = ? 
            WHERE id_usuario = ?
        `;
        
        await pool.query(query, [nombre, apellidos, telefono, id_rol, id]);
        res.json({ mensaje: 'Empleado actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el empleado' });
    }
});

// 3. Eliminar (Despedir) un empleado
router.delete('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar que un admin se elimine a sí mismo
        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta administrativa' });
        }

        await pool.query('DELETE FROM USUARIOS WHERE id_usuario = ?', [id]);
        res.json({ mensaje: 'Empleado eliminado del sistema' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el empleado' });
    }
});
//waza
module.exports = router;