const { requireAdmin } = require('../../../../../lib/auth');
const { query } = require('../../../../../lib/db');

module.exports = async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return res.status(401).json({ error: 'Admin only' });

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const { reason = 'Rejected' } = req.body || {};
  await query('UPDATE topups SET status=\'REJECTED\', reject_reason=$1 WHERE id=$2 AND status=\'PENDING\'', [reason, id]);
  res.json({ ok: true });
};
