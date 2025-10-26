const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const userSchema = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
    spotifyAccessToken: String,
    spotifyRefreshToken: String,
    youtubeAccessToken: String,
    youtubeRefreshToken: String,
});

const syncHistorySchema = new Schema({
    userId: ObjectId,
    sourcePlatform: String,
    targetPlatform: String, 
    playlistName: String,
    tracksCount: Number,
    syncDate: { type: Date, default: Date.now },
    status: String
});

const userModel = mongoose.model("user", userSchema);
const syncHistoryModel = mongoose.model("syncHistory", syncHistorySchema);

module.exports = {
    userModel,
    syncHistoryModel
};