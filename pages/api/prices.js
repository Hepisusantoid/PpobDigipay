export default async function handler(req, res) {
  const crypto = require("crypto");

  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_APIKEY;

  if (!username || !apiKey) {
    return res.status(500).json({ error: "Env DIGIFLAZZ_USERNAME/APIKEY belum di-set" });
  }

  // Digiflazz: sign = md5(username + api_key + "pricelist")
  const sign = crypto
    .createHash("md5")
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

    const json = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: json.message || "Gagal ambil data harga", raw: json });
    }

    const data = Array.isArray(json.data) ? json.data : [];

    const list = data
      .filter((p) => {
        const statusRaw = String(p.buyer_product_status ?? p.status ?? "").toLowerCase();
        const isActive = ["active", "available", "aktif", "true", "1"].includes(statusRaw);
        const price = Number(p.price);
        return isActive && Number.isFinite(price) && price > 0;
      })
      .map((p) => ({
        buyer_sku_code: p.buyer_sku_code,
        product_name: p.product_name,
        brand: p.brand || "",
        category: p.category || "",
        price: Number(p.price),
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 50);

    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
