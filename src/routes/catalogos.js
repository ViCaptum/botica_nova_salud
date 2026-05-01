// src/routes/catalogos.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Tu conexión a MySQL
const { auth, validarRol } = require('../middlewares/auth');

const ROLES = { ADMIN: 1, VENDEDOR: 2 };

// ==========================================
// RUTAS PARA CATEGORÍAS
// ==========================================

// GET: Listar todas las categorías (Accesible para todos)
router.get('/categorias', auth, async (req, res) => {
    try {
        const [categorias] = await pool.query('SELECT * FROM CATEGORIAS');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// POST: Crear nueva categoría (SOLO ADMIN)
router.post('/categorias', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { nombre_categoria } = req.body;
        if (!nombre_categoria) return res.status(400).json({ error: 'Falta el nombre' });

        const [resultado] = await pool.query(
            'INSERT INTO CATEGORIAS (nombre_categoria) VALUES (?)', 
            [nombre_categoria]
        );
        res.status(201).json({ id_categoria: resultado.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});

// ==========================================
// RUTAS PARA LABORATORIOS
// ==========================================

// GET: Listar todos los laboratorios
router.get('/laboratorios', auth, async (req, res) => {
    try {
        const [laboratorios] = await pool.query('SELECT * FROM LABORATORIOS');
        res.json(laboratorios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener laboratorios' });
    }
});

// POST: Crear nuevo laboratorio (SOLO ADMIN)
router.post('/laboratorios', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { nombre_laboratorio } = req.body;
        if (!nombre_laboratorio) return res.status(400).json({ error: 'Falta el nombre' });

        const [resultado] = await pool.query(
            'INSERT INTO LABORATORIOS (nombre_laboratorio) VALUES (?)', 
            [nombre_laboratorio]
        );
        res.status(201).json({ id_laboratorio: resultado.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear laboratorio' });
    }
});

module.exports = router;