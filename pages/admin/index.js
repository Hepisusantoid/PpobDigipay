import { useEffect, useState } from 'react';

export default function Admin() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const r = await fetch('/api/admin/topups?status=PENDING');
    const j = await r.json();
    setPending(Array.isArray(j) ? j : []);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    const r = await fetch('/api/admin/topups/' + id + '/approve', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ note: 'Approved via admin UI' })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || 'Approve failed');
    setMsg('Approved #' + id); load();
  };
  const reject = async (id) => {
    const reason = prompt('Alasan reject?') || 'Rejected';
    const r = await fetch('/api/admin/topups/' + id + '/reject', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ reason })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || 'Reject failed');
    setMsg('Rejected #' + id); load();
  };

  return (
    <div style={{maxWidth: 960, margin:'20px auto', fontFamily:'system-ui'}}>
      <h1>Admin — Topup Manual</h1>
      <p>Hanya akun dengan email = <b>ADMIN_EMAIL</b> (ENV) yang bisa akses API ini.</p>
      <button onClick={load}>Refresh</button>
      <table border="1" cellPadding="6" style={{width:'100%', marginTop:12, borderCollapse:'collapse'}}>
        <thead>
          <tr><th>ID</th><th>User</th><th>Amount</th><th>Method</th><th>Status</th><th>Proof</th><th>Action</th></tr>
        </thead>
        <tbody>
          {pending.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.email}</td>
              <td>Rp {Number(t.amount).toLocaleString('id-ID')}</td>
              <td>{t.method}</td>
              <td>{t.status}</td>
              <td>{t.proof_url ? <a href={t.proof_url} target="_blank">Bukti</a> : '-'}</td>
              <td>
                <button onClick={()=>approve(t.id)}>Approve</button>
                <button onClick={()=>reject(t.id)} style={{marginLeft:8}}>Reject</button>
              </td>
            </tr>
          ))}
          {pending.length === 0 && <tr><td colSpan="7" style={{textAlign:'center'}}>Tidak ada PENDING</td></tr>}
        </tbody>
      </table>
      {msg && <div style={{marginTop:12}}>{msg}</div>}
    </div>
  );
}
