import { useState, useEffect, useMemo } from "react";

const MANUAL_TSEL2K_SKU = process.env.NEXT_PUBLIC_TSEL2K_SKU || ""; // opsional

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Ambil "Pulsa Telkomsel" saja supaya fokus
  const fetchPrices = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/prices?category=Pulsa&brand=TELKOMSEL");
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

  // Deteksi otomatis Telkomsel 2.000 dari nama/sku
  const tsel2000 = useMemo(() => {
    const fromSku = MANUAL_TSEL2K_SKU
      ? products.find(p => p.buyer_sku_code === MANUAL_TSEL2K_SKU)
      : null;

    if (fromSku) return fromSku;

    return products.find(p => {
      const name = (p.product_name || "").toLowerCase();
      // cocok "2.000", "2000", "2 000"
      const has2000 = /(^|[^\d])2[.\s]?\d{3}(?!\d)/.test(name);
      const hasTelkomsel = /telkomsel/.test(name) || /telkomsel/.test((p.brand || "").toLowerCase());
      return hasTelkomsel && has2000;
    }) || null;
  }, [products]);

  // Susun list: Telkomsel 2.000 dipin di paling atas (tanpa duplikasi)
  const renderedList = useMemo(() => {
    const seen = new Set();
    const out = [];
    if (tsel2000) {
      out.push(tsel2000);
      seen.add(tsel2000.buyer_sku_code);
    }
    for (const p of products) if (!seen.has(p.buyer_sku_code)) out.push(p);
    return out;
  }, [products, tsel2000]);

  const selectTsel2000 = () => {
    if (tsel2000) {
      setSelected(tsel2000.buyer_sku_code);
      setMessage(`Dipilih: ${tsel2000.product_name} [${tsel2000.buyer_sku_code}]`);
    } else {
      setMessage(
        MANUAL_TSEL2K_SKU
          ? `SKU ${MANUAL_TSEL2K_SKU} tidak ditemukan di price list.`
          : "Produk Telkomsel 2.000 belum ada di price list akunmu."
      );
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={selectTsel2000} style={{ padding: 8, borderRadius: 8, border: "1px solid #aaa" }}>
          Pilih Telkomsel 2.000
        </button>
      </div>

      <label>Pilih Produk (Pulsa Telkomsel):</label><br />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={loading || renderedList.length === 0}
        style={{ padding: 12, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
      >
        <option value="">{loading ? "Memuat daftar..." : "-- pilih produk --"}</option>

        {tsel2000 && (
          <>
            <option value={tsel2000.buyer_sku_code}>
              ⭐ {tsel2000.product_name} — Rp{Number(tsel2000.price).toLocaleString("id-ID")}
            </option>
            <option disabled>────────────</option>
          </>
        )}

        {renderedList.map((p) => (
          <option key={p.buyer_sku_code} value={p.buyer_sku_code}>
            [{p.buyer_sku_code}] {p.product_name} — Rp{Number(p.price).toLocaleString("id-ID")}
          </option>
        ))}
      </select>

      <br /><br />
      <button onClick={handleOrder} style={{ padding: 12, borderRadius: 8, border: "1px solid #888", minWidth: 160 }}>
        Beli Sekarang
      </button>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{message}</pre>
    </div>
  );
}
