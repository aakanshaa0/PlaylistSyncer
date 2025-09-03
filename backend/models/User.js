const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username:{
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email:{
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password:{
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  createdAt:{
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    return next();
  }
  
  try{
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } 
  catch(error){
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(password){
  try{
    return await bcrypt.compare(password, this.password);
  }
  catch(error){
    throw new Error('Password comparison failed');
  }
};

module.exports = mongoose.model('User', UserSchema);