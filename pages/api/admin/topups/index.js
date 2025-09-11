const { requireAdmin } = require('../../../../lib/auth');
const { query } = require('../../../../lib/db');

module.exports = async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return res.status(401).json({ error: 'Admin only' });

  const { status = 'PENDING' } = req.query;
  const r = await query(
    'SELECT t.*, u.email FROM topups t JOIN users u ON u.id=t.user_id WHERE t.status=$1 ORDER BY t.id ASC',
    [status]
  );
  res.json(r.rows);
};
