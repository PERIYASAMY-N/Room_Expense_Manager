const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    
    // Check if it's a known error structure or generic
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorMiddleware;
