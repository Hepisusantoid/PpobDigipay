const { requireAdmin } = require('../../../../../lib/auth');
const { tx } = require('../../../../../lib/db');

module.exports = async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return res.status(401).json({ error: 'Admin only' });

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const { note = 'TOPUP APPROVED' } = req.body || {};

  try {
    await tx(async (db) => {
      const { rows } = await db.query('SELECT * FROM topups WHERE id=$1 FOR UPDATE', [id]);
      if (!rows.length) throw new Error('Topup not found');
      const t = rows[0];
      if (t.status !== 'PENDING') throw new Error('Topup already processed');

      const w = await db.query('SELECT * FROM wallets WHERE user_id=$1 FOR UPDATE', [t.user_id]);
      const current = Number(w.rows[0]?.balance || 0);
      const after = current + Number(t.amount);

      await db.query(
        `INSERT INTO wallet_ledger(user_id,type,amount,balance_after,ref_type,ref_id,note)
         VALUES ($1,'CREDIT',$2,$3,'TOPUP',$4,$5)`,
        [t.user_id, t.amount, after, t.id, note]
      );

      await db.query('UPDATE wallets SET balance=$1 WHERE user_id=$2', [after, t.user_id]);
      await db.query('UPDATE topups SET status=\'APPROVED\', approved_by=$1, approved_at=NOW() WHERE id=$2', [admin.id, t.id]);
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
