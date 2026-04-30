const express = require('express');
const router = express.Router();
const pool = require('../db');

const { auth, validarRol } = require('../middlewares/auth');

const ROLES = {
    ADMIN: 1,
    VENDEDOR: 2
};

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

module.exports = router;
