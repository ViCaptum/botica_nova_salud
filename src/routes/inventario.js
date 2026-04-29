const express = require('express');
const router = express.Router();
const pool = require('../db'); // Tu conexión a la base de datos

// OBTENER PRODUCTOS CON FILTROS (Búsqueda + Tipo)
router.get('/', async (req, res) => {
    try {
        // Recibimos los filtros del frontend
        // tipo puede ser: 'todos', 'generico', 'marca'
        const { buscar, tipo } = req.query; 

        let query = 'SELECT * FROM VISTA_CATALOGO_PRODUCTOS WHERE 1=1';
        let valores = [];

        // 1. Filtro por búsqueda (nombre o código)
        if (buscar) {
            query += ' AND (nombre_producto LIKE ? OR codigo_barras = ?)';
            valores.push(`%${buscar}%`, buscar);
        }

        // 2. Filtro por Combo Box (Tipo de medicamento)
        if (tipo === 'generico') {
            query += ' AND es_generico = 1';
        } else if (tipo === 'marca') {
            query += ' AND es_generico = 0';
        }
        // Si es 'todos', no añadimos nada a la query y trae todo por defecto

        const [productos] = await pool.query(query, valores);
        res.json(productos);

    } catch (error) {
        console.error("Error al filtrar inventario:", error);
        res.status(500).json({ error: 'Error al procesar los filtros de inventario' });
    }
});

// 2. CREAR UN NUEVO PRODUCTO (Solo Admins)
router.post('/', async (req, res) => {
    try {
        // En el futuro, aquí validaremos que req.usuario.rol === 'admin'
        
        // Extraemos los datos que el frontend envía en el "body" de la petición
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

        // Validación básica (Evita código basura en la BD)
        if (!nombre_producto || !precio_venta || !id_categoria) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Consulta parametrizada (Los signos ? evitan inyecciones SQL)
        const query = `
            INSERT INTO PRODUCTOS 
            (id_categoria, id_laboratorio, codigo_barras, nombre_producto, es_generico, precio_venta, stock_actual, stock_minimo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const valores = [id_categoria, id_laboratorio, codigo_barras, nombre_producto, es_generico, precio_venta, stock_actual, stock_minimo];

        // Ejecutamos la inserción
        const [resultado] = await pool.query(query, valores);

        // Devolvemos confirmación al frontend
        res.status(201).json({ 
            mensaje: 'Producto creado exitosamente', 
            id_producto: resultado.insertId 
        });

    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ error: 'Error al registrar el producto en la base de datos' });
    }
});

// 3. ACTUALIZAR UN PRODUCTO (Solo Admins)
router.put('/:id', async (req, res) => {
    try {
        // Capturamos el ID directamente de la URL (ej. /api/inventario/5)
        const { id } = req.params;
        
        // Extraemos los nuevos datos del body
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

        // Validación básica
        if (!nombre_producto || !precio_venta) {
            return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar' });
        }

        const query = `
            UPDATE PRODUCTOS 
            SET id_categoria = ?, id_laboratorio = ?, codigo_barras = ?, 
                nombre_producto = ?, es_generico = ?, precio_venta = ?, 
                stock_actual = ?, stock_minimo = ?
            WHERE id_producto = ?
        `;
        
        // El ID siempre va al final porque corresponde al último signo ? del WHERE
        const valores = [id_categoria, id_laboratorio, codigo_barras, nombre_producto, es_generico, precio_venta, stock_actual, stock_minimo, id];

        const [resultado] = await pool.query(query, valores);

        // Buena práctica: Verificar si el producto realmente existía
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en la base de datos' });
        }

        res.json({ mensaje: 'Producto actualizado correctamente' });

    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// 4. ELIMINAR UN PRODUCTO (Solo Admins)
router.delete('/:id', async (req, res) => {
    try {
        // Capturamos el ID de la URL
        const { id } = req.params;

        const query = 'DELETE FROM PRODUCTOS WHERE id_producto = ?';
        
        const [resultado] = await pool.query(query, [id]);

        // Verificamos si la base de datos realmente borró algo
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado, no se pudo eliminar' });
        }

        res.json({ mensaje: 'Producto eliminado correctamente' });

    } catch (error) {
        console.error("Error al eliminar producto:", error);
        
        // Capturamos errores de llave foránea (Integridad referencial)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                error: 'No se puede eliminar este producto porque ya tiene ventas registradas.' 
            });
        }
        
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

module.exports = router;