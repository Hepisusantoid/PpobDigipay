import { useState, useEffect, useMemo } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Pulsa");   // default fokus ke Pulsa
  const [brand, setBrand] = useState("");              // bisa pilih Telkomsel/Indosat, dll
  const [q, setQ] = useState("");                      // search
  const [selected, setSelected] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Ambil price list dengan filter
  const fetchPrices = async (cat = category, br = brand) => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      if (br) params.set("brand", br);
      const res = await fetch(`/api/prices?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
      else setMessage(data.error || "Gagal memuat harga");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  useEffect(() => { fetchPrices(category, brand); }, [category, brand]);

  // Brand unik dari data yang tampil
  const brandOptions = useMemo(() => {
    const set = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // List yang difilter dengan search
  const shown = useMemo(() => {
    const key = q.toLowerCase();
    return products.filter(p => {
      const s = `[${p.buyer_sku_code}] ${p.product_name} ${p.brand}`.toLowerCase();
      return s.includes(key);
    });
  }, [products, q]);

  // Pintasan pilih Telkomsel 2.000
  const selectTsel2000 = () => {
    const regex = /(^|[^0-9])2[\s.,]?000(?!\d)/; // cocok "2.000", "2000", "2 000"
    const item = products.find(p =>
      (p.brand || "").toLowerCase().includes("telkomsel") &&
      regex.test((p.product_name || "").replace(/\s+/g, " "))
    );
    if (item) {
      setSelected(item.buyer_sku_code);
      setMessage(`Dipilih: ${item.product_name} [${item.buyer_sku_code}]`);
    } else {
      setMessage("Produk Telkomsel 2.000 tidak ditemukan dalam daftar saat ini. Coba kosongkan filter brand/kategori atau refresh.");
    }
  };

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
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, Arial", maxWidth: 560 }}>
      <h1>🚀 PPOB Digiflazz</h1>

      <label>Nomor HP:</label><br />
      <input
        type="tel"
        inputMode="numeric"
        placeholder="Masukkan nomor HP"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ padding: 12, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
      /><br /><br />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Kategori:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: 12, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
          >
            <option value="">Semua</option>
            <option value="Pulsa">Pulsa</option>
            <option value="Data">Data</option>
            <option value="PLN">PLN</option>
            <option value="E-Money">E-Money</option>
            <option value="Games">Games</option>
            <option value="Voucher">Voucher</option>
          </select>
        </div>
        <div>
          <label>Brand:</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={{ padding: 12, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
          >
            <option value="">Semua</option>
            {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <input
        placeholder="Cari produk (mis. Telkomsel 2.000)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginTop: 12, padding: 12, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
      />

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setBrand("Telkomsel")} style={{ padding: 8, borderRadius: 8, border: "1px solid #aaa" }}>Brand: Telkomsel</button>
        <button onClick={selectTsel2000} style={{ padding: 8, borderRadius: 8, border: "1px solid #aaa" }}>Pilih Telkomsel 2.000</button>
        <button onClick={() => { setBrand(""); setCategory("Pulsa"); fetchPrices("Pulsa", ""); }} style={{ padding: 8, borderRadius: 8, border: "1px solid #aaa" }}>Reset Filter</button>
      </div>

      <br />
      <label>Pilih Produk:</label><br />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={loading || shown.length === 0}
        style={{ padding: 12, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
      >
        <option value="">{loading ? "Memuat daftar..." : "-- pilih produk --"}</option>
        {shown.map((p) => (
          <option key={p.buyer_sku_code} value={p.buyer_sku_code}>
            [{p.buyer_sku_code}] {p.product_name} — Rp{Number(p.price).toLocaleString("id-ID")}
          </option>
        ))}
      </select>

      <br /><br />
      <button
        onClick={handleOrder}
        style={{ padding: 12, borderRadius: 8, border: "1px solid #888", minWidth: 160 }}
      >
        Beli Sekarang
      </button>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{message}</pre>
    </div>
  );
              }
