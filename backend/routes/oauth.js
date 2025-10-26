const { Router } = require("express");
const oauthRouter = Router();
const SpotifyWebApi = require('spotify-web-api-node');
const { google } = require('googleapis');
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } = require("../config");

const BACKEND_URL = process.env.BACKEND_URL || 'https://playlistsync-backend.onrender.com';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: `${BACKEND_URL}/api/auth/spotify/callback`  
});

const oauth2Client = new google.auth.OAuth2(
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  `${BACKEND_URL}/api/auth/youtube/callback`
);

oauthRouter.get('/spotify', (req, res) => {
  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative', 
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-email'
  ];
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  res.redirect(authorizeURL);
});

oauthRouter.get('/spotify/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    res.json({
      success: true,
      accessToken: access_token,
      refreshToken: refresh_token
    });
  } 
  catch (error) {
    res.status(500).json({
      success: false,
      message: 'Spotify authentication failed'
    });
  }
});

oauthRouter.get('/youtube', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ];
  
  const authorizeURL = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  res.redirect(authorizeURL);
});

oauthRouter.get('/youtube/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    res.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    });
  } 
  catch (error) {
    res.status(500).json({
      success: false,
      message: 'YouTube authentication failed'
    });
  }
});

oauthRouter.get('/test-setup', (req, res) => {
  res.json({
    test
  });
});

module.exports = {
  oauthRouter: oauthRouter
};