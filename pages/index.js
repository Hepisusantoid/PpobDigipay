import { useState, useEffect } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
        else setMessage(data.error || "Gagal memuat harga");
      } catch (e) {
        setMessage(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  const handleOrder = async () => {
    setMessage("");
    if (!selected || !phone) {
      setMessage("⚠️ Pilih produk & isi nomor HP dulu");
      return;
    }
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: selected, customer_no: phone }),
      });
      const data = await res.json();
      setMessage(JSON.stringify(data, null, 2));
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, -apple-system, Arial" }}>
      <h1>🚀 PPOB Digiflazz</h1>

      <label>Nomor HP:</label><br />
      <input
        type="tel"
        inputMode="numeric"
        placeholder="Masukkan nomor HP"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ padding: 12, width: "100%", maxWidth: 420, borderRadius: 8, border: "1px solid #ccc" }}
      /><br /><br />

      <label>Pilih Produk:</label><br />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={loading || products.length === 0}
        style={{ padding: 12, width: "100%", maxWidth: 420, borderRadius: 8, border: "1px solid #ccc" }}
      >
        <option value="">{loading ? "Memuat daftar..." : "-- pilih produk --"}</option>
        {products.map((p) => (
          <option key={p.buyer_sku_code} value={p.buyer_sku_code}>
            {p.product_name} — Rp{Number(p.price).toLocaleString("id-ID")}
          </option>
        ))}
      </select><br /><br />

      <button
        onClick={handleOrder}
        style={{ padding: 12, borderRadius: 8, border: "1px solid #888", minWidth: 160 }}
      >
        Beli Sekarang
      </button>

      <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre>
    </div>
  );
          }
