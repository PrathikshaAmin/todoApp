const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import the User model

const router = express.Router();

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login Request:', { email, password }); // Debug log

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user by email and include the password field
    const user = await User.findOne({ email }).select('+password');
    console.log('User Found:', user); // Debug log

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the entered password with the hashed password
    console.log('Entered Password:', password);
    console.log('Hashed Password from DB:', user.password);

    const isPasswordValid = await user.comparePassword(password);
    console.log('Password Valid:', isPasswordValid); // Debug log

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Token:', token); // Debug log

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error during login:', err); // Debug log
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;