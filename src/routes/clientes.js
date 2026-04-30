const express = require('express');
const router = express.Router();
const pool = require('../db');

const { auth } = require('../middlewares/auth');

// Buscar cliente por DNI
router.get('/buscar/:dni', auth, async (req, res) => {
    try {
        const [cliente] = await pool.query(
            'SELECT * FROM CLIENTES WHERE dni = ?',
            [req.params.dni]
        );

        if (cliente.length === 0) {
            return res.status(404).json({ error: 'No encontrado' });
        }

        res.json(cliente[0]);

    } catch {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Crear nuevo cliente
router.post('/', auth, async (req, res) => {
    try {
        const { dni, nombres, apellidos, telefono, correo } = req.body;

        if (!nombres || !apellidos) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        const [resultado] = await pool.query(
            'INSERT INTO CLIENTES (dni, nombres, apellidos, telefono, correo) VALUES (?, ?, ?, ?, ?)',
            [dni, nombres, apellidos, telefono, correo]
        );

        res.status(201).json({ id_cliente: resultado.insertId });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Duplicado' });
        }
        res.status(500).json({ error: 'Error al registrar' });
    }
});

module.exports = router;
