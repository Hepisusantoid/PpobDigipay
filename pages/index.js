import { useEffect, useState } from 'react';

export default function Home() {
  const [me, setMe] = useState(null);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [register, setRegister] = useState({ name: '', email: '', password: '' });
  const [wallet, setWallet] = useState({ balance: 0, ledger: [] });
  const [prices, setPrices] = useState([]);
  const [topup, setTopup] = useState({ amount: '', method: 'MANUAL_TRANSFER', proof_url: '', note: '' });
  const [order, setOrder] = useState({ sku: '', customer_no: '', price_sell: '' });
  const [msg, setMsg] = useState('');

  async function fetchWallet() {
    const r = await fetch('/api/wallet');
    if (r.ok) setWallet(await r.json());
  }
  async function fetchPrices() {
    const r = await fetch('/api/prices');
    const j = await r.json();
    setPrices(Array.isArray(j) ? j : []);
  }
  useEffect(() => { fetchPrices(); }, []);

  const doRegister = async () => {
    const r = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(register)});
    const j = await r.json(); if(!r.ok) return setMsg(j.error||'Register failed');
    setMe(j); setMsg('Register success & logged in'); fetchWallet();
  };
  const doLogin = async () => {
    const r = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(login)});
    const j = await r.json(); if(!r.ok) return setMsg(j.error||'Login failed');
    setMe(j); setMsg('Login success'); fetchWallet();
  };
  const doLogout = async () => { await fetch('/api/auth/logout'); setMe(null); setWallet({balance:0,ledger:[]}); };

  const createTopup = async () => {
    const r = await fetch('/api/topups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(topup)});
    const j = await r.json(); if(!r.ok) return setMsg(j.error||'Topup failed');
    setMsg('Pengajuan topup terkirim (PENDING)');
  };

  const makeOrder = async () => {
    const r = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      buyer_sku_code: order.sku, customer_no: order.customer_no, price_sell: Number(order.price_sell||0)
    })});
    const j = await r.json(); if(!r.ok) return setMsg(j.error||'Order failed');
    setMsg('Order SUCCESS (SIM) #' + j.id); fetchWallet();
  };

  return (
    <div style={{maxWidth: 860, margin:'20px auto', fontFamily: 'system-ui'}}>
      <h1>Digipay — Mode A (Gratis, Simulator)</h1>
      <p style={{color:'#666'}}>Register/Login → Ajukan Top-up (manual) → Admin Approve → Beli (SIM)</p>

      {!me && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div>
            <h3>Register</h3>
            <input placeholder="Nama" value={register.name} onChange={e=>setRegister({...register, name:e.target.value})} style={{width:'100%',padding:8}}/>
            <input placeholder="Email" value={register.email} onChange={e=>setRegister({...register, email:e.target.value})} style={{width:'100%',padding:8,marginTop:8}}/>
            <input placeholder="Password" type="password" value={register.password} onChange={e=>setRegister({...register, password:e.target.value})} style={{width:'100%',padding:8,marginTop:8}}/>
            <button onClick={doRegister} style={{marginTop:8,padding:'8px 12px'}}>Register</button>
          </div>
          <div>
            <h3>Login</h3>
            <input placeholder="Email" value={login.email} onChange={e=>setLogin({...login, email:e.target.value})} style={{width:'100%',padding:8}}/>
            <input placeholder="Password" type="password" value={login.password} onChange={e=>setLogin({...login, password:e.target.value})} style={{width:'100%',padding:8,marginTop:8}}/>
            <button onClick={doLogin} style={{marginTop:8,padding:'8px 12px'}}>Login</button>
          </div>
        </div>
      )}

      {me && (
        <div style={{marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>Login sebagai: <b>{me.email}</b> ({me.role})</div>
          <div><button onClick={doLogout}>Logout</button></div>
        </div>
      )}

      {me && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16}}>
          <div style={{border:'1px solid #ddd', borderRadius:8, padding:12}}>
            <h3>Wallet</h3>
            <div>Saldo: <b>Rp {Number(wallet.balance||0).toLocaleString('id-ID')}</b></div>
            <button onClick={fetchWallet} style={{marginTop:8}}>Refresh</button>
            <h4 style={{marginTop:12}}>Mutasi Terbaru</h4>
            <ul style={{maxHeight:200, overflow:'auto'}}>
              {wallet.ledger.map(r => (
                <li key={r.id}>[{r.type}] Rp {Number(r.amount).toLocaleString('id-ID')} → Saldo {Number(r.balance_after).toLocaleString('id-ID')} — {new Date(r.created_at).toLocaleString('id-ID')}</li>
              ))}
            </ul>
          </div>
          <div style={{border:'1px solid #ddd', borderRadius:8, padding:12}}>
            <h3>Ajukan Top-up Manual</h3>
            <input type="number" placeholder="Nominal (Rp)" value={topup.amount} onChange={e=>setTopup({...topup, amount:e.target.value})} style={{width:'100%',padding:8}}/>
            <input placeholder="Metode (BCA/DANA/BRI)" value={topup.method} onChange={e=>setTopup({...topup, method:e.target.value})} style={{width:'100%',padding:8,marginTop:8}}/>
            <input placeholder="URL bukti transfer (opsional)" value={topup.proof_url} onChange={e=>setTopup({...topup, proof_url:e.target.value})} style={{width:'100%',padding:8,marginTop:8}}/>
            <input placeholder="Catatan (opsional)" value={topup.note} onChange={e=>setTopup({...topup, note:e.target.value})} style={{width:'100%',padding:8,marginTop:8}}/>
            <button onClick={createTopup} style={{marginTop:8}}>Kirim Pengajuan</button>
          </div>
        </div>
      )}

      <div style={{border:'1px solid #ddd', borderRadius:8, padding:12, marginTop:16}}>
        <h3>Pembelian (SIMULATOR)</h3>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8}}>
          <select value={order.sku} onChange={e=>setOrder({...order, sku:e.target.value})}>
            <option value="">-- pilih produk --</option>
            {prices.map(p => (
              <option key={p.buyer_sku_code} value={p.buyer_sku_code}>
                [{p.buyer_sku_code}] {p.product_name} — Rp {Number(p.price).toLocaleString('id-ID')}
              </option>
            ))}
          </select>
          <input placeholder="Nomor tujuan" value={order.customer_no} onChange={e=>setOrder({...order, customer_no:e.target.value})}/>
          <input type="number" placeholder="Harga jual (Rp)" value={order.price_sell} onChange={e=>setOrder({...order, price_sell:e.target.value})}/>
          <button onClick={makeOrder}>Beli (SIM)</button>
        </div>
      </div>

      {msg && <div style={{marginTop:12, padding:8, background:'#f6ffed', border:'1px solid #b7eb8f'}}>{msg}</div>}
    </div>
  );
}
