import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const genrateRefreshToken = async (userId) => {
  const tokan = await jwt.sign({ id: userId }, process.env.SECRET_KEY_REFRESH_TOKEN, { expiresIn: '30d' });

  // Store the refresh token in the user model
  await User.updateOne({ _id: userId }, { refresh_token: tokan });

  return tokan;
};

export default genrateRefreshToken;
