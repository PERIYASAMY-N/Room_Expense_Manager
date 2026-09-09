const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Extract from JWT directly
            req.user = decoded; // { userId, memberId, roomId, role, accountType }
            req.roomId = decoded.roomId;
            req.memberId = decoded.memberId;
            req.accountType = decoded.accountType || 'ROOM'; // Default to ROOM for backward compatibility
            
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Your session has expired. Please login again.' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const requireRoom = (req, res, next) => {
    if (!req.roomId) {
        return res.status(403).json({ message: 'Room access required. Personal accounts cannot access this.' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ message: 'You do not have permission to access this page.' });
    }
};

module.exports = { protect, requireAdmin, requireRoom };
