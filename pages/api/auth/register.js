const { query } = require('../../../lib/db');
const { bcrypt, signToken, setAuthCookie } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
  if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const role = (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email.toLowerCase()) ? 'admin' : 'user';

  const r = await query(
    'INSERT INTO users(name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,email,role',
    [name, email.toLowerCase(), hash, role]
  );
  await query('INSERT INTO wallets(user_id, balance) VALUES ($1,0)', [r.rows[0].id]);

  const token = signToken({ id: r.rows[0].id, email, role });
  setAuthCookie(res, token);
  res.status(201).json({ id: r.rows[0].id, email, role });
};
