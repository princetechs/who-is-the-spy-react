const isDev = process.env.NODE_ENV !== 'production';
const clientUrl = isDev ? 'http://localhost:5173' : process.env.CLIENT_URL || 'https://your-domain.vercel.app';
const PORT = process.env.PORT || 3000;

module.exports = {
  isDev,
  clientUrl,
  PORT
};