const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7
  }));
}
function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize('token', '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0
  }));
}
function getTokenFromReq(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.token || null;
}
function requireAuth(req, res) {
  try {
    const token = getTokenFromReq(req);
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}
function requireAdmin(req, res) {
  const u = requireAuth(req, res);
  if (!u || u.role !== 'admin') return null;
  return u;
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, getTokenFromReq, requireAuth, requireAdmin, bcrypt };
