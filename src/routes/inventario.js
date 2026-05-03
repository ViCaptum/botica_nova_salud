const express = require('express');
const router = express.Router();
const pool = require('../db');

const { auth, validarRol } = require('../middlewares/auth');
const { success, error } = require('../utils/response');

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

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener inventario' });
    }
});

// Obtener productos con stock bajo (ADMIN Y VENDEDOR)
router.get('/alertas', auth, async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT id_producto, nombre_producto, stock_actual, stock_minimo
            FROM PRODUCTOS
            WHERE stock_actual <= stock_minimo
        `);

        success(res, productos, 'Productos con stock bajo');

    } catch (err) {
        console.error(err);
        error(res, 'Error al obtener alertas');
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

        if (!nombre_producto || !precio_venta || !id_categoria) {
            return error(res, 'Faltan campos obligatorios', 400);
        }

        const query = `
            INSERT INTO PRODUCTOS 
            (id_categoria, id_laboratorio, codigo_barras, nombre_producto, es_generico, precio_venta, stock_actual, stock_minimo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            id_categoria, 
            id_laboratorio, 
            codigo_barras, 
            nombre_producto, 
            es_generico, 
            precio_venta, 
            stock_actual, 
            stock_minimo
        ];

        const [resultado] = await pool.query(query, valores);

        success(res, {
            id_producto: resultado.insertId
        }, 'Producto creado correctamente', 201);

    } catch (err) {
        console.error(err);

        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Código de barras duplicado', 409);
        }

        error(res, 'Error al crear producto');
    }
});

// Actualizar producto (SOLO ADMIN)
router.put('/:id', auth, validarRol([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;

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

        if (!nombre_producto || !precio_venta) {
            return error(res, 'Faltan campos obligatorios', 400);
        }

        const query = `
            UPDATE PRODUCTOS 
            SET id_categoria = ?, id_laboratorio = ?, codigo_barras = ?, 
                nombre_producto = ?, es_generico = ?, precio_venta = ?, 
                stock_actual = ?, stock_minimo = ?
            WHERE id_producto = ?
        `;

        const valores = [
            id_categoria, 
            id_laboratorio, 
            codigo_barras, 
            nombre_producto, 
            es_generico, 
            precio_venta, 
            stock_actual, 
            stock_minimo,
            id
        ];

        const [resultado] = await pool.query(query, valores);

        if (resultado.affectedRows === 0) {
            return error(res, 'Producto no encontrado', 404);
        }

        success(res, null, 'Producto actualizado correctamente');

    } catch (err) {
        console.error(err);
        error(res, 'Error al actualizar producto');
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
