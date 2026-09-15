const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Should contain userId

            next();
        } catch (error) {
            res.status(401);
            return next(new Error('Not authorized, token failed'));
        }
    } else {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};

module.exports = { protect };
