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

// Registro de usuario con validación de rol y hash de contraseña
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

module.exports = router;
