import crypto from "crypto";

export default async function handler(req, res) {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_APIKEY;

  if (!username || !apiKey) {
    return res.status(500).json({ error: "Env DIGIFLAZZ_USERNAME/APIKEY belum di-set" });
  }

  // Digiflazz: sign = md5(username + api_key + "pricelist")
  const sign = crypto.createHash("md5")
    .update(username + apiKey + "pricelist")
    .digest("hex");

  try {
    const response = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "prepaid",
        username,
        sign
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || "Gagal ambil data harga" });
    }

    // Ambil hanya yang aktif & ada harga
    const list = (data.data || [])
      .filter(p => (p.buyer_product_status || "").toLowerCase() === "active" && Number(p.price) > 0)
      .map(p => ({
        buyer_sku_code: p.buyer_sku_code,
        product_name: p.product_name,
        brand: p.brand,
        category: p.category,
        price: Number(p.price)
      }));

    return res.status(200).json(list.slice(0, 50)); // tampilkan 50 dulu biar ringan
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
