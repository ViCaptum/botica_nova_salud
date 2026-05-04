const express = require('express');
const router = express.Router();
const pool = require('../db');

const { auth, validarRol } = require('../middlewares/auth');

const ROLES = {
    ADMIN: 1,
    VENDEDOR: 2
};

// Ruta para crear una nueva venta
router.post('/', auth, validarRol([ROLES.ADMIN, ROLES.VENDEDOR]), async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id_cliente, total_venta, detalles } = req.body;

        const id_usuario = req.usuario.id; // 🔥 desde el token

        if (!total_venta || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        await connection.beginTransaction();

        const clienteId = id_cliente || null;

        const [resultVenta] = await connection.query(
            'INSERT INTO VENTAS (id_usuario, id_cliente, total_venta) VALUES (?, ?, ?)',
            [id_usuario, clienteId, total_venta]
        );

        const id_venta = resultVenta.insertId;

        for (let item of detalles) {

            if (item.cantidad <= 0) {
                throw new Error('Cantidad inválida');
            }

            await connection.query(
                'INSERT INTO DETALLE_VENTAS (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.subtotal]
            );

            const [resultStock] = await connection.query(
                'UPDATE PRODUCTOS SET stock_actual = stock_actual - ? WHERE id_producto = ? AND stock_actual >= ?',
                [item.cantidad, item.id_producto, item.cantidad]
            );

            if (resultStock.affectedRows === 0) {
                throw new Error(`Stock insuficiente producto ${item.id_producto}`);
            }
        }

        await connection.commit();

        res.status(201).json({ id_venta });

    } catch (error) {
        await connection.rollback();

        if (error.message.includes('Stock') || error.message.includes('Cantidad')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Error en venta' });

    } finally {
        connection.release();
    }
});

// Ruta para obtener el detalle de una venta específica
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Cabecera
        const [venta] = await pool.query(`
            SELECT v.id_venta, v.fecha_venta, v.total_venta,
                   c.dni AS cliente_dni,
                   CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
                   u.nombre AS vendedor
            FROM VENTAS v
            LEFT JOIN CLIENTES c ON v.id_cliente = c.id_cliente
            INNER JOIN USUARIOS u ON v.id_usuario = u.id_usuario
            WHERE v.id_venta = ?
        `, [id]);

        if (venta.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Detalles
        const [detalle] = await pool.query(`
            SELECT d.cantidad, d.precio_unitario, d.subtotal,
                   p.nombre_producto
            FROM DETALLE_VENTAS d
            INNER JOIN PRODUCTOS p ON d.id_producto = p.id_producto
            WHERE d.id_venta = ?
        `, [id]);

        res.json({
            venta: venta[0],
            detalle
        });

    } catch (error) {
        console.error("Error detalle venta:", error);
        res.status(500).json({ error: 'Error al obtener detalle' });
    }
});


// Ruta para obtener el historial de ventas, con filtro opcional por vendedor
router.get('/', auth, async (req, res) => {
    try {
        const { vendedor_id } = req.query;
        
        // Usamos la vista que ya creaste en tu DB[cite: 28].
        // Aplicamos alias (AS) para que coincida con lo que el frontend JS espera.
        let query = `
            SELECT 
                id_venta, 
                fecha_venta, 
                vendedor AS nombre_vendedor, 
                dni_cliente, 
                total_venta AS total 
            FROM VISTA_HISTORIAL_VENTAS 
            WHERE 1=1
        `;
        
        let valores = [];

        // Si se envió un ID desde el filtro de autocompletado, filtramos
        if (vendedor_id) {
            query += ' AND id_usuario = ?';
            valores.push(vendedor_id);
        }

        // Ordenamos para que las ventas más recientes salgan arriba
        query += ' ORDER BY fecha_venta DESC';

        const [ventas] = await pool.query(query, valores);
        res.json(ventas);

    } catch (error) {
        console.error("Error al obtener el historial de ventas:", error);
        res.status(500).json({ error: 'Error interno al cargar el historial' });
    }
});

module.exports = router;
