const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

(async () => {
    try {
        // Pedimos una conexión prestada al pool solo para probar
        const connection = await pool.getConnection();
        console.log(`Conexión exitosa a la base de datos: ${process.env.DB_NAME}`);
        connection.release(); 
    } catch (error) {
        console.error("Error fatal al conectar con la base de datos:");
        
        // Clasificamos errores comunes para que sea más fácil depurar
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('La conexión con la base de datos fue cerrada.');
        } else if (error.code === 'ER_CON_COUNT_ERROR') {
            console.error('La base de datos tiene demasiadas conexiones.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('La conexión fue rechazada (¿Está encendido MySQL en XAMPP?).');
        } else {
            console.error(error.message);
        }
    }
})();

module.exports = pool;