import crypto from "crypto";

export default async function handler(req, res) {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_APIKEY;

  // sign untuk price-list
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
    if (data.data) return res.status(200).json(data.data.slice(0, 20));
    return res.status(500).json({ error: data.message || "Gagal ambil data harga" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
