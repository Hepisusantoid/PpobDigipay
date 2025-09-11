const { requireAuth } = require('../../lib/auth');
const { query } = require('../../lib/db');

module.exports = async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const wallet = await query('SELECT balance FROM wallets WHERE user_id=$1', [user.id]);
  const ledger = await query(
    'SELECT id,type,amount,balance_after,note,created_at FROM wallet_ledger WHERE user_id=$1 ORDER BY id DESC LIMIT 20',
    [user.id]
  );

  res.json({ balance: wallet.rows[0]?.balance || 0, ledger: ledger.rows });
};
