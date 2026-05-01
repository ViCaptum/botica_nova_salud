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

// Registro de usuarios (solo ADMIN puede crear usuarios)
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

// Login y rutas protegidas con autenticación y autorización
// y roles definidos. El token JWT incluirá el id_usuario, 
// id_rol y nombre para facilitar la gestión de permisos en el frontend.
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

        // Crear token JWT con información del usuario
        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                rol: usuario.id_rol,
                nombre: usuario.nombre
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

// Ruta para ADMIN
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

router.get('/', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        // AQUÍ ESTÁ LA CLAVE: Debes pedir correo y telefono a la base de datos
        const query = `
            SELECT 
                id_usuario AS id, 
                nombre, 
                apellidos, 
                correo, 
                telefono, 
                username, 
                id_rol AS rol 
            FROM USUARIOS
            ORDER BY nombre ASC
        `;
        
        const [usuarios] = await pool.query(query);
        res.json(usuarios);

    } catch (error) {
        res.status(500).json({ error: 'Error interno al cargar los empleados' });
    }
});

router.delete('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el admin no se esté borrando a sí mismo por accidente
        if (req.usuario.id === parseInt(id)) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }

        const [resultado] = await pool.query(
            'DELETE FROM USUARIOS WHERE id_usuario = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Empleado eliminado correctamente' });

    } catch (error) {
        // Manejo de errores si el usuario tiene ventas asociadas
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: el empleado tiene ventas registradas.' });
        }
        res.status(500).json({ error: 'Error al eliminar el empleado' });
    }
});

router.put('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, telefono, id_rol } = req.body;

        // Fíjate que NO actualizamos el correo, username ni password aquí.
        const [resultado] = await pool.query(
            'UPDATE USUARIOS SET nombre = ?, apellidos = ?, telefono = ?, id_rol = ? WHERE id_usuario = ?',
            [nombre, apellidos, telefono, id_rol, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Datos del empleado actualizados' });

    } catch (error) {
        console.error("Error al actualizar empleado:", error);
        res.status(500).json({ error: 'Error interno al actualizar' });
    }
});

// ==========================================
// PERFIL: OBTENER DATOS PROPIOS
// ==========================================
router.get('/perfil/me', auth, async (req, res) => {
    try {
        // Agregamos "AS rol" para que el frontend reciba la palabra que espera
        const query = 'SELECT nombre, apellidos, correo, telefono, username, id_rol AS rol FROM USUARIOS WHERE id_usuario = ?';
        const [usuario] = await pool.query(query, [req.usuario.id]);
        res.json(usuario[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar el perfil' });
    }
});

// ==========================================
// PERFIL: ACTUALIZAR DATOS Y CONTRASEÑA
// ==========================================
router.put('/perfil/me', auth, async (req, res) => {
    try {
        const { username, correo, telefono, password_actual, password_nueva } = req.body;
        const id_usuario = req.usuario.id;

        // 1. Si intenta cambiar contraseña, validamos la actual
        let nuevoHash = null;
        if (password_nueva) {
            if (!password_actual) return res.status(400).json({ error: 'Falta contraseña actual' });
            
            const [userDb] = await pool.query('SELECT password_hash FROM USUARIOS WHERE id_usuario = ?', [id_usuario]);
            const valido = await bcrypt.compare(password_actual, userDb[0].password_hash);
            if (!valido) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            
            nuevoHash = await bcrypt.hash(password_nueva, 10);
        }

        // 2. Ejecutamos la actualización (incluyendo username)
        const query = `
            UPDATE USUARIOS 
            SET username = ?, correo = ?, telefono = ? 
            ${nuevoHash ? ', password_hash = ?' : ''} 
            WHERE id_usuario = ?
        `;
        
        const params = [username, correo, telefono];
        if (nuevoHash) params.push(nuevoHash);
        params.push(id_usuario);

        await pool.query(query, params);
        res.json({ mensaje: 'Perfil y nombre de usuario actualizados' });

    } catch (error) {
        // COMPROBACIÓN DE DUPLICADO: MySQL arroja ER_DUP_ENTRY si el username ya existe[cite: 5, 24]
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El nombre de usuario o correo ya está en uso.' });
        }
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

module.exports = router;