const { query } = require('../../../lib/db');
const { bcrypt, signToken, setAuthCookie } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const { rows } = await query('SELECT id,email,password_hash,role FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: rows[0].id, email: rows[0].email, role: rows[0].role });
  setAuthCookie(res, token);
  res.json({ id: rows[0].id, email: rows[0].email, role: rows[0].role });
};
