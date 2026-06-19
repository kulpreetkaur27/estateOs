
const jwt = require('jsonwebtoken');
const User = require('./models/User');

module.exports = async (req, res, next) => {
  try {
    // Check both headers and cookies for token
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error auth.js:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};