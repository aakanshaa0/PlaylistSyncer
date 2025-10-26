const { userModel } = require("../db");

async function userMiddleware(req, res, next) {
    const userId = req.userId;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        
        req.user = user;
        next();
    } catch (e) {
        res.status(500).json({
            message: "Server error"
        });
    }
}

module.exports = {
    userMiddleware: userMiddleware
};