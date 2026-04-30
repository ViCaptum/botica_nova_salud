const jwt = require('jsonwebtoken');

const SECRET_KEY = 'tu_secreto_super_seguro'; // luego lo pasas a .env

// 🔐 Middleware de autenticación
const auth = (req, res, next) => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        // Formato: "Bearer token"
        const tokenLimpio = token.split(' ')[1];

        const decoded = jwt.verify(tokenLimpio, SECRET_KEY);

        req.usuario = decoded; // guardamos usuario en request

        next();

    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// 🛡️ Middleware de roles
const validarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        next();
    };
};

module.exports = {
    auth,
    validarRol,
    SECRET_KEY
};
