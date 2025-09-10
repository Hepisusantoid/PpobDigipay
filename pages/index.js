import { useState, useEffect } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPrices = async () => {
      const res = await fetch("/api/prices");
      const data = await res.json();
      setProducts(data);
    };
    fetchPrices();
  }, []);

  const handleOrder = async () => {
    if (!selected || !phone) {
      setMessage("⚠️ Pilih produk & isi nomor HP dulu");
      return;
    }

    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: selected, customer_no: phone }),
    });

    const data = await res.json();
    setMessage(JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🚀 PPOB Digiflazz</h1>
      <label>Nomor HP:</label><br />
      <input
        type="text"
        placeholder="Masukkan nomor HP"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ padding: "10px", width: "250px" }}
      /><br /><br />

      <label>Pilih Produk:</label><br />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{ padding: "10px", width: "250px" }}
      >
        <option value="">-- pilih produk --</option>
        {products.map((p) => (
          <option key={p.buyer_sku_code} value={p.buyer_sku_code}>
            {p.product_name} - Rp{p.price.toLocaleString("id-ID")}
          </option>
        ))}
      </select><br /><br />

      <button onClick={handleOrder} style={{ padding: "10px" }}>
        Beli Sekarang
      </button>

      <pre>{message}</pre>
    </div>
  );
}
