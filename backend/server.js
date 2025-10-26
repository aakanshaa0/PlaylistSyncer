const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth').authRouter);
app.use('/api/user', require('./routes/user').userRouter);
app.use('/api/sync', require('./routes/sync').syncRouter);
app.use('/api/auth', require('./routes/oauth').oauthRouter);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Could not connect to MongoDB:", err.message);
  });

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));