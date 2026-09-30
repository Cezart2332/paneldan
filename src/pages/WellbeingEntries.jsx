import { useEffect, useState } from 'react';
import { adminApi } from '../api';

const labels = { home:'Acasă',work:'Muncă',travel:'Deplasare',social:'Social',other:'Altul',poor:'Slab',average:'Mediu',good:'Bun',none:'Fără',some:'Puțină',much:'Multă',rest:'Odihnă',walk:'Plimbare',exercise:'Mișcare',breathing:'Respirație',grounding:'Grounding',helpful:'M-a ajutat',neutral:'Neutru',unhelpful:'Nu m-a ajutat',completed:'Încheiat',stopped:'Oprit' };
function fmtDate(row) {
  // Show the time actually reported on the phone, independently of admin timezone.
  return new Date(Date.parse(row.occurredAt)-row.timezoneOffset*60000).toISOString().replace('T',' ').slice(0,16);
}
export default function WellbeingEntries({kind}) {
  const [page,setPage]=useState(1), [user,setUser]=useState(''), [since,setSince]=useState(''), [until,setUntil]=useState('');
  const [result,setResult]=useState({items:[],total:0}), [loading,setLoading]=useState(true), [error,setError]=useState('');
  const [detail,setDetail]=useState(null), [detailLoading,setDetailLoading]=useState(false), [retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true;
    const timer = setTimeout(() => { if(active){setLoading(true);setError('');setDetail(null);} },0);
    const params={page:String(page),limit:'50'};
    if(user)params.user_id=user;
    if(since)params.since=new Date(`${since}T00:00:00`).toISOString();
    if(until)params.until=new Date(`${until}T23:59:59.999`).toISOString();
    adminApi.wellbeing(kind,params).then((value)=>{if(active)setResult(value);}).catch((failure)=>{if(active)setError(failure.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;clearTimeout(timer);};
  },[kind,page,user,since,until,retry]);
  async function openDetail(id) {
    setDetailLoading(true);
    try { const response=await adminApi.wellbeingDetail(kind,id);setDetail(response.item); }
    catch(failure){setError(failure.message);}
    finally{setDetailLoading(false);}
  }
  const isCheckin=kind==='checkins';
  const pages=Math.max(1,Math.ceil(result.total/50));
  return <div className="page"><div className="page-header"><h1>{isCheckin?'Check-in-uri':'Sesiuni SOS'}</h1><p>{result.total} înregistrări · date raportate de utilizatori</p></div>
    <div className="toolbar"><input aria-label="Filtru utilizator" className="search-input search-input--sm" placeholder="User ID" type="number" min="1" value={user} onChange={(e)=>{setUser(e.target.value);setPage(1);}} />
      <label>De la <input aria-label="De la" className="search-input" type="date" value={since} onChange={(e)=>{setSince(e.target.value);setPage(1);}} /></label>
      <label>Până la <input aria-label="Până la" className="search-input" type="date" value={until} onChange={(e)=>{setUntil(e.target.value);setPage(1);}} /></label>
      <button className="btn btn-ghost" onClick={()=>setRetry(retry+1)}>Reîncarcă</button>
    </div>
    {error&&<p role="alert">{error}</p>}
    {loading?<div className="page-loading">Se încarcă…</div>:<><div className="table-wrap"><table><thead><tr><th>Utilizator</th><th>Data raportării</th><th>{isCheckin?'Nivel':'Tehnici'}</th><th>{isCheckin?'Context':'Feedback'}</th><th>{isCheckin?'Notiță':'Stare'}</th><th>Detalii</th></tr></thead><tbody>
      {result.items.map((row)=><tr key={row.id}><td><div className="td-user"><span className="td-user__name">{row.userName||`#${row.userId}`}</span><span className="td-user__email">{row.email}</span></div></td><td>{fmtDate(row)}</td><td>{isCheckin?`${row.level}/10`:row.techniques.map((t)=>labels[t]).join(', ')}</td><td>{isCheckin?(labels[row.context]||'—'):(labels[row.feedback?.rating]||'Fără evaluare')}</td><td>{isCheckin?<span>{row.note?.slice(0,120)||'—'}</span>:labels[row.status]}</td><td><button className="btn btn-ghost btn-sm" disabled={detailLoading} onClick={()=>openDetail(row.id)}>Vezi detalii</button></td></tr>)}
      {!result.items.length&&<tr><td colSpan="6" className="td-empty">Nu există înregistrări în această perioadă.</td></tr>}
    </tbody></table></div><div className="toolbar"><button className="btn btn-ghost" disabled={page<=1} onClick={()=>setPage(page-1)}>Înapoi</button><span>Pagina {page} / {pages}</span><button className="btn btn-ghost" disabled={page>=pages} onClick={()=>setPage(page+1)}>Înainte</button></div></>}
    {detail&&<section className="wellbeing-detail" aria-label="Detalii înregistrare"><button className="btn btn-ghost" onClick={()=>setDetail(null)}>Închide detaliile</button><h2>{detail.userName||`Utilizator #${detail.userId}`}</h2><p>{fmtDate(detail)} · {detail.timezone||'Ora telefonului'}</p>
      {isCheckin?<><p><strong>Nivel:</strong> {detail.level}/10</p><p style={{whiteSpace:'pre-wrap'}}>{detail.note||'Fără notiță'}</p>{[['Context',detail.context],['Somn',detail.sleep],['Cafeină',detail.caffeine],['Activitate',detail.activity]].map(([label,value])=><p key={label}><strong>{label}:</strong> {labels[value]||'Neraportat'}</p>)}</>:<><p><strong>Tehnici:</strong> {detail.techniques.map((t)=>labels[t]).join(', ')}</p><p><strong>Durată activă:</strong> {Math.round(detail.elapsedMs/1000)} / {detail.duration} secunde</p><p><strong>Ritm:</strong> {detail.pattern}</p><p><strong>Stare:</strong> {labels[detail.status]}</p><p><strong>Feedback:</strong> {labels[detail.feedback?.rating]||'Neraportat'}</p><p><strong>Anxietate după:</strong> {detail.feedback?.level?`${detail.feedback.level}/10`:'Neraportat'}</p><p><strong>Context:</strong> {labels[detail.feedback?.context]||'Neraportat'}</p></>}
      <p>Datele descriu raportări personale, fără interpretări de diagnostic.</p>
    </section>}
  </div>;
}
