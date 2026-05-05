const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middlewares/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        // 1. KPIs Generales (Corregido el mapeo de los totales)
        const [[{ total: total_productos }]] = await pool.query('SELECT COUNT(*) as total FROM PRODUCTOS');
        const [[{ total: total_ventas }]] = await pool.query('SELECT COALESCE(SUM(total_venta), 0) as total FROM VENTAS');
        const [[{ total: total_usuarios }]] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS');

        // 2. Productos más vendidos (Top 5)
        const [productosTop] = await pool.query(`
            SELECT p.nombre_producto, SUM(d.cantidad) as total_vendido 
            FROM DETALLE_VENTAS d 
            JOIN PRODUCTOS p ON d.id_producto = p.id_producto 
            GROUP BY p.id_producto 
            ORDER BY total_vendido DESC 
            LIMIT 5
        `);

        // 3. Mejores Vendedores (Top 5)
        const [vendedoresTop] = await pool.query(`
            SELECT u.nombre, SUM(v.total_venta) as total_recaudado 
            FROM VENTAS v 
            JOIN USUARIOS u ON v.id_usuario = u.id_usuario 
            GROUP BY u.id_usuario 
            ORDER BY total_recaudado DESC 
            LIMIT 5
        `);

        // 4. Alertas de Stock Crítico
        const [alertasStock] = await pool.query(`
            SELECT nombre_producto, stock_actual, stock_minimo 
            FROM PRODUCTOS 
            WHERE stock_actual <= stock_minimo
            ORDER BY stock_actual ASC 
            LIMIT 8
        `);

        res.json({
            kpis: {
                productos: total_productos,
                ventas: total_ventas,
                usuarios: total_usuarios
            },
            graficos: {
                productos: productosTop,
                vendedores: vendedoresTop
            },
            alertas: alertasStock
        });

    } catch (error) {
        console.error("Error cargando dashboard:", error);
        res.status(500).json({ error: 'Error interno del servidor al cargar métricas' });
    }
});

module.exports = router;