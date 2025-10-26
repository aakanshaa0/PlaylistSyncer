const { Router } = require("express");
const userRouter = Router();
const { userModel, syncHistoryModel } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { userMiddleware } = require("../middleware/user");

userRouter.get("/profile", authMiddleware, userMiddleware, async function (req, res) {
    const user = req.user;

    res.json({
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            hasSpotify: !!user.spotifyAccessToken,
            hasYoutube: !!user.youtubeAccessToken
        }
    });
});

userRouter.post("/connect-spotify", authMiddleware, userMiddleware, async function (req, res) {
    const userId = req.userId;
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({
            message: "Access token is required"
        });
    }

    try {
        await userModel.updateOne(
            { _id: userId },
            {
                spotifyAccessToken: accessToken,
                spotifyRefreshToken: refreshToken
            }
        );

        res.json({
            message: "Spotify connected successfully"
        });
    } 
    catch (e) {
        res.status(500).json({
            message: "Failed to connect Spotify"
        });
    }
});

userRouter.post("/connect-youtube", authMiddleware, userMiddleware, async function (req, res) {
    const userId = req.userId;
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({
            message: "Access token is required"
        });
    }

    try {
        await userModel.updateOne(
            { _id: userId },
            {
                youtubeAccessToken: accessToken,
                youtubeRefreshToken: refreshToken
            }
        );

        res.json({
            message: "YouTube connected successfully"
        });
    } 
    catch (e) {
        res.status(500).json({
            message: "Failed to connect YouTube"
        });
    }
});

userRouter.get("/sync-history", authMiddleware, userMiddleware, async function (req, res) {
    const userId = req.userId;

    const history = await syncHistoryModel.find({
        userId: userId
    }).sort({ syncDate: -1 });

    res.json({
        history: history
    });
});

module.exports = {
    userRouter: userRouter
};