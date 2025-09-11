const { requireAuth } = require('../../../lib/auth');
const { query } = require('../../../lib/db');

module.exports = async function handler(req, res) {
  const me = requireAuth(req, res);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    const { amount, method, proof_url, note } = req.body || {};
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const r = await query(`
      INSERT INTO topups(user_id,amount,method,proof_url,note,status)
      VALUES ($1,$2,$3,$4,$5,'PENDING')
      RETURNING id,amount,method,proof_url,note,status,created_at
    `, [me.id, amt, method || 'MANUAL_TRANSFER', proof_url || null, note || null]);

    return res.status(201).json(r.rows[0]);
  }

  if (req.method === 'GET') {
    const r = await query('SELECT * FROM topups WHERE user_id=$1 ORDER BY id DESC LIMIT 50', [me.id]);
    return res.json(r.rows);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
