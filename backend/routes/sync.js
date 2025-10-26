const { Router } = require("express");
const syncRouter = Router();
const { userModel, syncHistoryModel } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { userMiddleware } = require("../middleware/user");
const SpotifyWebApi = require('spotify-web-api-node');
const { google } = require('googleapis');

const spotifyService = {
    getPlaylists: async (accessToken) => {
        try {
            const spotifyApi = new SpotifyWebApi();
            spotifyApi.setAccessToken(accessToken);
            
            const response = await spotifyApi.getUserPlaylists({ limit: 50 });
            return response.body.items.map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                trackCount: playlist.tracks.total,
                description: playlist.description,
                image: playlist.images[0]?.url
            }));
        } 
        catch (error) {
            console.error('Spotify API Error:', error);
            throw new Error('Failed to fetch Spotify playlists');
        }
    },

    getPlaylistTracks: async (accessToken, playlistId) => {
        try {
            const spotifyApi = new SpotifyWebApi();
            spotifyApi.setAccessToken(accessToken);
            
            const response = await spotifyApi.getPlaylistTracks(playlistId);
            return response.body.items.map(item => ({
                name: item.track.name,
                artist: item.track.artists.map(artist => artist.name).join(', '),
                album: item.track.album.name,
                duration: item.track.duration_ms,
                id: item.track.id
            }));
        } 
        catch (error) {
            console.error('Spotify Tracks Error:', error);
            throw new Error('Failed to fetch playlist tracks');
        }
    },

    createPlaylist: async (accessToken, userId, name, description = '') => {
        try {
            const spotifyApi = new SpotifyWebApi();
            spotifyApi.setAccessToken(accessToken);
            
            const me = await spotifyApi.getMe();
            const currentUserId = me.body.id;
            
            const response = await spotifyApi.createPlaylist(currentUserId, {
                name: name,
                description: description,
                public: false
            });
            
            return response.body.id;
        } 
        catch (error) {
            console.error('Spotify Create Playlist Error:', error);
            throw new Error('Failed to create Spotify playlist');
        }
    },

    addTracksToPlaylist: async (accessToken, playlistId, trackUris) => {
        try {
            const spotifyApi = new SpotifyWebApi();
            spotifyApi.setAccessToken(accessToken);
            
            await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
        } 
        catch (error) {
            console.error('Spotify Add Tracks Error:', error);
            throw new Error('Failed to add tracks to playlist');
        }
    },

    searchTrack: async (accessToken, trackName, artistName) => {
        try {
            const spotifyApi = new SpotifyWebApi();
            spotifyApi.setAccessToken(accessToken);
            
            const query = `track:${trackName} artist:${artistName}`;
            const response = await spotifyApi.searchTracks(query, { limit: 1 });
            
            return response.body.tracks.items[0]?.uri;
        } 
        catch (error) {
            console.error('Spotify Search Error:', error);
            return null;
        }
    }
};

const youtubeService = {
    getPlaylists: async (accessToken) => {
        try {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            
            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            
            const response = await youtube.playlists.list({
                part: 'snippet,contentDetails',
                mine: true,
                maxResults: 50
            });
            
            return response.data.items.map(playlist => ({
                id: playlist.id,
                name: playlist.snippet.title,
                trackCount: playlist.contentDetails.itemCount,
                description: playlist.snippet.description,
                image: playlist.snippet.thumbnails?.default?.url
            }));
        } 
        catch (error) {
            console.error('YouTube API Error:', error);
            throw new Error('Failed to fetch YouTube playlists');
        }
    },

    createPlaylist: async (accessToken, name, description = '') => {
        try {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            
            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            
            const response = await youtube.playlists.insert({
                part: 'snippet,status',
                requestBody: {
                    snippet: {
                        title: name,
                        description: description
                    },
                    status: {
                        privacyStatus: 'private'
                    }
                }
            });
            
            return response.data.id;
        } 
        catch (error) {
            console.error('YouTube Create Playlist Error:', error);
            throw new Error('Failed to create YouTube playlist');
        }
    },

    searchVideo: async (accessToken, trackName, artistName) => {
        try {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            
            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            
            const query = `${trackName} ${artistName} official audio`;
            const response = await youtube.search.list({
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 1
            });
            
            return response.data.items[0]?.id?.videoId;
        } 
        catch (error) {
            console.error('YouTube Search Error:', error);
            return null;
        }
    },

    addVideoToPlaylist: async (accessToken, playlistId, videoId) => {
        try {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            
            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            
            await youtube.playlistItems.insert({
                part: 'snippet',
                requestBody: {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: videoId
                        }
                    }
                }
            });
        } 
        catch (error) {
            console.error('YouTube Add Video Error:', error);
            throw new Error('Failed to add video to playlist');
        }
    }
};

syncRouter.get("/spotify-playlists", authMiddleware, userMiddleware, async function (req, res) {
    const user = req.user;

    if (!user.spotifyAccessToken) {
        return res.status(400).json({
            message: "Spotify not connected"
        });
    }

    try {
        const playlists = await spotifyService.getPlaylists(user.spotifyAccessToken);
        
        res.json({
            playlists: playlists
        });
    } 
    catch (e) {
        res.status(500).json({
            message: "Failed to fetch Spotify playlists: " + e.message
        });
    }
});

syncRouter.get("/youtube-playlists", authMiddleware, userMiddleware, async function (req, res) {
    const user = req.user;

    if (!user.youtubeAccessToken) {
        return res.status(400).json({
            message: "YouTube not connected"
        });
    }

    try {
        const playlists = await youtubeService.getPlaylists(user.youtubeAccessToken);
        
        res.json({
            playlists: playlists
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to fetch YouTube playlists: " + e.message
        });
    }
});

syncRouter.post("/spotify-to-youtube", authMiddleware, userMiddleware, async function (req, res) {
    const user = req.user;
    const { playlistId } = req.body;

    if (!user.spotifyAccessToken || !user.youtubeAccessToken) {
        return res.status(400).json({
            message: "Both Spotify and YouTube must be connected"
        });
    }

    try {
        const spotifyPlaylists = await spotifyService.getPlaylists(user.spotifyAccessToken);
        const playlist = spotifyPlaylists.find(p => p.id === playlistId);
        
        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        const tracks = await spotifyService.getPlaylistTracks(user.spotifyAccessToken, playlistId);
        
        const youtubePlaylistId = await youtubeService.createPlaylist(
            user.youtubeAccessToken, 
            playlist.name,
            `Synced from Spotify: ${playlist.description || ''}`
        );

        let successfulTracks = 0;
        for (let i = 0; i < Math.min(tracks.length, 10); i++) { //Limit to 10 tracks for testing
            const track = tracks[i];
            const videoId = await youtubeService.searchVideo(
                user.youtubeAccessToken, 
                track.name, 
                track.artist
            );
            
            if (videoId) {
                await youtubeService.addVideoToPlaylist(
                    user.youtubeAccessToken,
                    youtubePlaylistId,
                    videoId
                );
                successfulTracks++;
            }
        }

        await syncHistoryModel.create({
            userId: user._id,
            sourcePlatform: 'spotify',
            targetPlatform: 'youtube',
            playlistName: playlist.name,
            tracksCount: successfulTracks,
            status: successfulTracks > 0 ? 'success' : 'partial'
        });

        res.json({
            message: `Synced "${playlist.name}" to YouTube successfully! ${successfulTracks} tracks added.`,
            playlistId: youtubePlaylistId,
            tracksSynced: successfulTracks,
            totalTracks: tracks.length
        });
    } 
    catch (e) {
        await syncHistoryModel.create({
            userId: user._id,
            sourcePlatform: 'spotify',
            targetPlatform: 'youtube',
            playlistName: 'Unknown',
            tracksCount: 0,
            status: 'failed'
        });

        res.status(500).json({
            message: "Failed to sync playlist: " + e.message
        });
    }
});

syncRouter.post("/youtube-to-spotify", authMiddleware, userMiddleware, async function (req, res) {
    const user = req.user;
    const { playlistId } = req.body;

    if (!user.spotifyAccessToken || !user.youtubeAccessToken) {
        return res.status(400).json({
            message: "Both Spotify and YouTube must be connected"
        });
    }

    try {
        const youtubePlaylists = await youtubeService.getPlaylists(user.youtubeAccessToken);
        const playlist = youtubePlaylists.find(p => p.id === playlistId);
        
        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        const spotifyPlaylistId = await spotifyService.createPlaylist(
            user.spotifyAccessToken,
            null,
            playlist.name,
            `Synced from YouTube: ${playlist.description || ''}`
        );

        await syncHistoryModel.create({
            userId: user._id,
            sourcePlatform: 'youtube',
            targetPlatform: 'spotify',
            playlistName: playlist.name,
            tracksCount: 0,
            status: 'success'
        });

        res.json({
            message: `Synced "${playlist.name}" to Spotify successfully!`,
            playlistId: spotifyPlaylistId,
            note: "Playlist created. Track syncing needs additional implementation."
        });
    } 
    catch (e) {
        await syncHistoryModel.create({
            userId: user._id,
            sourcePlatform: 'youtube',
            targetPlatform: 'spotify',
            playlistName: 'Unknown',
            tracksCount: 0,
            status: 'failed'
        });

        res.status(500).json({
            message: "Failed to sync playlist: " + e.message
        });
    }
});

module.exports = {
    syncRouter: syncRouter
};