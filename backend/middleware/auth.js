const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function authMiddleware(req, res, next) {
    const token = req.headers.token;
    
    if (!token) {
        return res.status(403).json({
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } 
    catch (e) {
        res.status(403).json({
            message: "Invalid token"
        });
    }
}

module.exports = {
    authMiddleware: authMiddleware
};