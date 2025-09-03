const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if(!username || !email || !password){
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    if(username.length < 3){
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    if(password.length < 6){
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if(!isValidEmail(email)){
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const emailExists = await User.findOne({email});
    if(emailExists){
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const usernameExists = await User.findOne({ username });
    if(usernameExists){
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    const user = new User({username, email, password});
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } 
  catch(error){
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

router.post('/login', async (req, res) => {
  try{
    const {email, password} = req.body;

    if(!email || !password){
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } 
  catch(error){
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

module.exports = router;