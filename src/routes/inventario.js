const express = require('express');
const router = express.Router();
const pool = require('../db');

const { auth, validarRol } = require('../middlewares/auth');

const ROLES = {
    ADMIN: 1,
    VENDEDOR: 2
};

// Obtener inventario registrado (ADMIN Y VENDEDOR)
router.get('/', auth, async (req, res) => {
    try {
        const { buscar, tipo } = req.query;

        let query = 'SELECT * FROM VISTA_CATALOGO_PRODUCTOS WHERE 1=1';
        let valores = [];

        if (buscar) {
            query += ' AND (nombre_producto LIKE ? OR codigo_barras = ?)';
            valores.push(`%${buscar}%`, buscar);
        }

        if (tipo === 'generico') query += ' AND es_generico = 1';
        if (tipo === 'marca') query += ' AND es_generico = 0';

        const [productos] = await pool.query(query, valores);
        res.json(productos);

    } catch (error) {
        res.status(500).json({ error: 'Error al obtener inventario' });
    }
});

// Crear producto (SOLO ADMIN)
router.post('/', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const {
            id_categoria,
            id_laboratorio,
            codigo_barras,
            nombre_producto,
            es_generico,
            precio_venta,
            stock_actual,
            stock_minimo
        } = req.body;

        if (!nombre_producto || precio_venta <= 0) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const query = `
            INSERT INTO PRODUCTOS 
            (id_categoria, id_laboratorio, codigo_barras, nombre_producto, es_generico, precio_venta, stock_actual, stock_minimo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [resultado] = await pool.query(query, [
            id_categoria,
            id_laboratorio,
            codigo_barras,
            nombre_producto,
            es_generico,
            precio_venta,
            stock_actual || 0,
            stock_minimo || 0
        ]);

        res.status(201).json({ id_producto: resultado.insertId });

    } catch (error) {
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// Actualizar producto (SOLO ADMIN)
router.put('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;

        const query = `UPDATE PRODUCTOS SET ? WHERE id_producto = ?`;
        const [resultado] = await pool.query(query, [req.body, id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Actualizado' });

    } catch {
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// Eliminar producto (SOLO ADMIN)
router.delete('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            'DELETE FROM PRODUCTOS WHERE id_producto = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'No encontrado' });
        }

        res.json({ mensaje: 'Eliminado' });

    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Producto con ventas' });
        }
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

module.exports = router;
