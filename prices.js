export default async function handler(req, res) {
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_APIKEY;

  try {
    const response = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "prepaid",
        username,
        sign: "testing", // untuk price list gunakan "testing"
      }),
    });

    const data = await response.json();

    if (data.data) {
      res.status(200).json(data.data.slice(0, 20)); // contoh: ambil 20 produk pertama
    } else {
      res.status(500).json({ error: "Gagal ambil data harga" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}