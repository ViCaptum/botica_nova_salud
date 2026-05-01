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

// DELETE: Eliminar categoría (SOLO ADMIN)[cite: 27]
router.delete('/categorias/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query('DELETE FROM CATEGORIAS WHERE id_categoria = ?', [id]);
        
        if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'No se puede eliminar: existen productos usando esta categoría' });
        }
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

// DELETE: Eliminar laboratorio (SOLO ADMIN)[cite: 27]
router.delete('/laboratorios/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query('DELETE FROM LABORATORIOS WHERE id_laboratorio = ?', [id]);
        
        if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Laboratorio no encontrado' });
        res.json({ mensaje: 'Laboratorio eliminado' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'No se puede eliminar: existen productos usando este laboratorio' });
        }
        res.status(500).json({ error: 'Error al eliminar laboratorio' });
    }
});

module.exports = router;