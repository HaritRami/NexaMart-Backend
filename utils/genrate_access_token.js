import jwt from 'jsonwebtoken';

const genrateAccessTokan = async (userId) => {
  const tokan = await jwt.sign({ id: userId }, process.env.SECRET_KEY_ACCESS_TOKEN, { expiresIn: '5h' });
  return tokan;
};

export default genrateAccessTokan;
