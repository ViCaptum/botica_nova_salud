require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api/dashboard', require('./routes/dashboard'));

const inventarioRoutes = require('./routes/inventario');
const usuariosRoutes = require('./routes/usuarios');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');
const catalogosRoutes = require('./routes/catalogos');

app.use('/api/inventario', inventarioRoutes);
app.use('/api/usuarios', usuariosRoutes); 
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api', catalogosRoutes);

app.listen(PORT, () => {
    console.log(`Ingresa a http://localhost:${PORT} para ver el frontend`);
});