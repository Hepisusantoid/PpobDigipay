const { clearAuthCookie } = require('../../../lib/auth');
module.exports = async function handler(req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
};
