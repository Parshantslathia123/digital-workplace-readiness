const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc Register a new employee (admins cannot be created publicly)
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, jobTitle, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Public registration always creates an "employee" role account.
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      jobTitle: jobTitle || '',
      department: department || '',
      role: 'employee'
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    next(err);
  }
};

// @desc Login
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    next(err);
  }
};

// @desc Logout
// @route POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc Get current logged-in user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: sanitizeUser(req.user) });
  } catch (err) {
    next(err);
  }
};

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
}

module.exports = { register, login, logout, getMe };
