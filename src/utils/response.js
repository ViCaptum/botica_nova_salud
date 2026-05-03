const success = (res, data = null, message = 'OK', status = 200) => {
    return res.status(status).json({
        ok: true,
        message,
        data
    });
};

const error = (res, message = 'Error', status = 500) => {
    return res.status(status).json({
        ok: false,
        error: message
    });
};

module.exports = { success, error };
