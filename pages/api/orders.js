const { requireAuth } = require('../../lib/auth');
const { tx } = require('../../lib/db');

const PROVIDER_MODE = process.env.PROVIDER_MODE || 'SIM'; // SIM|LIVE (LIVE dipakai nanti)
const DEFAULT_PRICE = 10000;

module.exports = async function handler(req, res) {
  const me = requireAuth(req, res);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { buyer_sku_code, customer_no, price_sell } = req.body || {};
  if (!buyer_sku_code || !customer_no) return res.status(400).json({ error: 'Missing fields' });
  const sell = Number(price_sell || DEFAULT_PRICE);
  if (!Number.isFinite(sell) || sell <= 0) return res.status(400).json({ error: 'Invalid price' });

  if (PROVIDER_MODE !== 'SIM') return res.status(400).json({ error: 'LIVE mode not enabled in Mode A' });

  try {
    const order = await tx(async (db) => {
      const w = await db.query('SELECT * FROM wallets WHERE user_id=$1 FOR UPDATE', [me.id]);
      const bal = Number(w.rows[0]?.balance || 0);
      if (bal < sell) throw new Error('Saldo tidak cukup');

      const after = bal - sell;
      const o = await db.query(`
        INSERT INTO orders(user_id,sku,product_name,brand,price_buy,price_sell,margin,customer_no,provider,ref_id,rc,message,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *`,
        [me.id, buyer_sku_code, buyer_sku_code, '', 0, sell, sell, customer_no, 'SIM', 'SIM-'+Date.now(), '00', 'Simulated success', 'SUCCESS']
      );
      await db.query(
        `INSERT INTO wallet_ledger(user_id,type,amount,balance_after,ref_type,ref_id,note)
         VALUES ($1,'DEBIT',$2,$3,'ORDER',$4,$5)`,
        [me.id, sell, after, o.rows[0].id, 'DEBIT FOR ORDER']
      );
      await db.query('UPDATE wallets SET balance=$1 WHERE user_id=$2', [after, me.id]);
      return o.rows[0];
    });

    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
