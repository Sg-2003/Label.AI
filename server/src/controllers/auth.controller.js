const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.registerUser({ name, email, password, role });
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user._id);
  res.status(200).json({
    success: true,
    data: { user }
  });
});

module.exports = {
  register,
  login,
  getMe
};
