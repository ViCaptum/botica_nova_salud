const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());//para que la se use json y no de errores
app.use(express.static('public'));//para las futuras views

const inventarioRoutes = require('./routes/inventario');//para importar el modulo con la api de inventrario

// Conectamos la ruta. A partir de aquí, todo lo de inventario.js empieza con /api/inventario
app.use('/api/inventario', inventarioRoutes);

app.listen(PORT, () => {
    console.log(`Servidor de Botica Nova Salud encendido en el puerto ${PORT}`);
    console.log(`Ingresa a http://localhost:${PORT} para ver el frontend`);
});