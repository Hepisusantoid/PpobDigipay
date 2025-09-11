const crypto = require('crypto');

module.exports = async function handler(req, res) {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_APIKEY;

  try {
    if (username && apiKey) {
      const sign = crypto.createHash('md5').update(username + apiKey + 'pricelist').digest('hex');
      const r = await fetch('https://api.digiflazz.com/v1/price-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: 'prepaid', username, sign })
      });
      const j = await r.json();
      if (Array.isArray(j.data)) {
        const list = j.data
          .filter(p => Number(p.price) > 0)
          .map(p => ({
            buyer_sku_code: p.buyer_sku_code,
            product_name: p.product_name,
            brand: p.brand || '',
            category: p.category || '',
            price: Number(p.price)
          }));
        return res.json(list.slice(0, 100));
      }
    }
  } catch { /* fallback */ }

  return res.json([
    { buyer_sku_code: 'TSEL-2K', product_name: 'Telkomsel 2.000', brand: 'TELKOMSEL', category: 'Pulsa', price: 2500 },
    { buyer_sku_code: 'TSEL-5K', product_name: 'Telkomsel 5.000', brand: 'TELKOMSEL', category: 'Pulsa', price: 6500 },
    { buyer_sku_code: 'ISAT-5K', product_name: 'Indosat 5.000', brand: 'INDOSAT', category: 'Pulsa', price: 6500 },
    { buyer_sku_code: 'PLN-20K', product_name: 'Token PLN 20.000', brand: 'PLN', category: 'PLN', price: 21000 }
  ]);
};
