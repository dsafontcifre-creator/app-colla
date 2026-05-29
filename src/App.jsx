import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyAPCswvXmDJlTn7PKrdOb_WCKcTqfyEgNA",
  authDomain: "app-colla.firebaseapp.com",
  projectId: "app-colla",
  storageBucket: "app-colla.firebasestorage.app",
  messagingSenderId: "235447122137",
  appId: "1:235447122137:web:d06e1e6e487159ec7e26c8",
  measurementId: "G-FX4HDRRS3P"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TREASURER = "Edu";
const ME        = "David";

const GROUPS = [
  { id: 1,  members: ["David",     "Carmen"] },
  { id: 2,  members: ["Inma",      "Roky"] },
  { id: 3,  members: ["Carla",     "Diego"] },
  { id: 4,  members: ["Maria",     "Edu"] },
  { id: 5,  members: ["Zurine",    "Carlos"] },
  { id: 6,  members: ["Marta",     "Alejandro"] },
  { id: 7,  members: ["Raquel",    "Fran"] },
  { id: 8,  members: ["Sandri",    "Guille"] },
  { id: 9,  members: ["Yani",      "Patri"] },
  { id: 10, members: ["Lledo",     "Carmenxita"] },
  { id: 11, members: ["Sergio",    "Miembro 22"] },
  { id: 12, members: ["Miembro"] },
];

const MEMBERS = GROUPS.flatMap((g, gi) =>
  g.members.map((name, ni) => ({ id: gi * 2 + ni + 1, name, groupId: g.id }))
);

const EVENT_TYPES = {
  comida:  { label: "Comida",  color: "#3d8000" },
  cena:    { label: "Cena",    color: "#5a6ea8" },
  reunion: { label: "Reunión", color: "#c07800" },
  otro:    { label: "Evento",  color: "#6e6860" },
};

// ─── THEME ────────────────────────────────────────────────────────────────────

const C = {
  bg:"#f2ede2", paper:"#faf7f0", border:"#d8d0c0",
  text:"#141410", muted:"#6e6860", faint:"#a8a098",
  accent:"#7fff00", accentD:"#3d8000",
  line:"#e4ddd0", neg:"#c0392b", warn:"#c07800", warnL:"#fff4e0",
  black:"#141410",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${C.bg}; }
  input:focus, textarea:focus { border-color:${C.accentD} !important; outline:none; }
  input[type=date]::-webkit-calendar-picker-indicator { opacity:.35; cursor:pointer; }
  .pill { transition:background .15s,color .15s,border-color .15s; cursor:pointer; user-select:none; }
  .pill:hover { opacity:.82; }
  .pill-on { background:${C.accent} !important; color:${C.black} !important; border-color:${C.accent} !important; }
  .menu-row { transition:opacity .15s; cursor:pointer; }
  .menu-row:hover .menu-num { color:${C.accent} !important; }
  .menu-row:hover .menu-label { color:${C.accent} !important; }
  .fab { transition:transform .15s; }
  .fab:hover { transform:scale(1.06); }
  .fab:active { transform:scale(.94); }
  .card-h { transition:box-shadow .18s; }
  .card-h:hover { box-shadow:0 3px 14px rgba(0,0,0,.07); }
  .btn-sm:active { transform:scale(.95); }
  ::-webkit-scrollbar { display:none; }
  textarea { resize:none; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const F    = { head:"'Bebas Neue', sans-serif", body:"'DM Sans', sans-serif" };
const gg   = id => GROUPS.find(g => g.id === id);
const ini  = n  => n ? n[0].toUpperCase() : "?";
const isTR = () => ME === TREASURER;
const fmtD = s  => {
  const d = new Date(s + "T12:00:00");
  return { day:d.getDate(), mon:d.toLocaleDateString("es-ES",{month:"short"}), wday:d.toLocaleDateString("es-ES",{weekday:"long"}) };
};

// ─── ATOMS ────────────────────────────────────────────────────────────────────

const Av = ({ name, size=28, on=false }) => (
  <span style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, background:on?C.accent:C.line, color:on?C.black:C.muted, fontSize:size*.38, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:F.body, border:on?`2px solid ${C.accent}`:`1px solid ${C.border}` }}>
    {ini(name)}
  </span>
);

const Tag = ({ children, color=C.accentD, bg, style }) => (
  <span style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color, background:bg||color+"18", padding:"2px 8px", borderRadius:3, fontFamily:F.body, fontWeight:600, whiteSpace:"nowrap", ...style }}>
    {children}
  </span>
);

const Lbl = ({ children, mt=0 }) => (
  <div style={{ fontSize:9, letterSpacing:4, color:C.faint, textTransform:"uppercase", marginBottom:8, marginTop:mt, fontFamily:F.body }}>
    {children}
  </div>
);

const Card = ({ children, style, onClick, noHover }) => (
  <div className={noHover?"":"card-h"} onClick={onClick} style={{ background:C.paper, border:`1px solid ${C.border}`, borderRadius:6, padding:16, marginBottom:10, cursor:onClick?"pointer":"default", ...style }}>
    {children}
  </div>
);

const Inp = ({ label, multiline, ...p }) => (
  <div style={{ marginBottom:14 }}>
    {label && <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", color:C.muted, marginBottom:5, fontFamily:F.body }}>{label}</div>}
    {multiline
      ? <textarea {...p} rows={4} style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:5, padding:"10px 12px", color:C.text, fontSize:14, fontFamily:F.body }} />
      : <input   {...p}          style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:5, padding:"10px 12px", color:C.text, fontSize:14, fontFamily:F.body }} />
    }
  </div>
);

const Divider = ({ mt=12, mb=12 }) => <div style={{ height:1, background:C.line, margin:`${mt}px 0 ${mb}px` }} />;

const BtnGhost = ({ children, onClick, style }) => (
  <button className="btn-sm" onClick={onClick} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, padding:"8px 14px", fontSize:10, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", fontFamily:F.body, color:C.muted, ...style }}>
    {children}
  </button>
);

const BtnAccent = ({ children, onClick, style }) => (
  <button className="btn-sm" onClick={onClick} style={{ background:C.accent, color:C.black, border:"none", borderRadius:5, padding:"8px 16px", fontSize:10, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", fontFamily:F.body, fontWeight:700, ...style }}>
    {children}
  </button>
);

const BackBtn = ({ onClick, label="Menú" }) => (
  <button onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:10, background:C.paper, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 16px", cursor:"pointer", fontFamily:F.body, marginBottom:24, color:C.text }}>
    <span style={{ fontFamily:F.head, fontSize:22, lineHeight:1, color:C.accent }}>←</span>
    <span style={{ fontSize:11, letterSpacing:2.5, textTransform:"uppercase", fontWeight:500 }}>{label}</span>
  </button>
);

const Modal = ({ title, onClose, onConfirm, btnLabel="Guardar", children }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(20,20,16,.55)", display:"flex", alignItems:"flex-end", zIndex:300 }} onClick={onClose}>
    <div style={{ background:C.paper, borderRadius:"14px 14px 0 0", padding:24, width:"100%", maxHeight:"90vh", overflowY:"auto", borderTop:`4px solid ${C.accent}` }} onClick={e=>e.stopPropagation()}>
      <div style={{ fontFamily:F.head, fontSize:30, color:C.text, marginBottom:20, letterSpacing:1 }}>{title}</div>
      {children}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:12 }}>
        <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
        <BtnAccent onClick={onConfirm}>{btnLabel}</BtnAccent>
      </div>
    </div>
  </div>
);

const MemberPills = ({ selected, onToggle, multi=true }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:14 }}>
    {MEMBERS.map(m => {
      const on = multi ? selected.includes(m.id) : selected===m.name;
      return (
        <span key={m.id} className={`pill ${on?"pill-on":""}`} onClick={()=>onToggle(multi?m.id:m.name)}
          style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:12, fontFamily:F.body }}>
          <Av name={m.name} size={16} on={on}/>{m.name}
        </span>
      );
    })}
  </div>
);

const SectionHeader = ({ title, onBack }) => (
  <div style={{ background:C.paper, borderBottom:`1px solid ${C.border}`, padding:"20px 20px 16px", position:"sticky", top:0, zIndex:200 }}>
    <BackBtn onClick={onBack} />
    <div style={{ fontFamily:F.head, fontSize:38, letterSpacing:2, color:C.text, lineHeight:1 }}>{title}</div>
  </div>
);

const Spinner = () => (
  <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:40 }}>
    <div style={{ width:32, height:32, border:`3px solid ${C.line}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
    <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
  </div>
);

// ─── POLL WIDGET ──────────────────────────────────────────────────────────────

const PollWidget = ({ poll, onVote, onClose }) => {
  const totalVoters = [...new Set(poll.options.flatMap(o=>o.votes))].length;
  const myVotes     = poll.options.filter(o=>o.votes.includes(ME)).map(o=>o.id);
  const maxVotes    = Math.max(...poll.options.map(o=>o.votes.length), 1);
  return (
    <Card noHover style={{ borderLeft:`4px solid ${C.accent}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ flex:1, paddingRight:8 }}>
          <div style={{ fontFamily:F.head, fontSize:20, color:C.text, letterSpacing:.5, lineHeight:1.2, marginBottom:6 }}>{poll.title}</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Tag color={C.faint}>{poll.multi?"Varias opciones":"Una opción"}</Tag>
            <Tag color={C.faint}>{totalVoters} votos</Tag>
            {!poll.open && <Tag color={C.neg}>Cerrada</Tag>}
          </div>
        </div>
        {onClose && poll.open && <BtnGhost onClick={()=>onClose(poll.id)} style={{ fontSize:9, padding:"4px 10px", flexShrink:0 }}>Cerrar</BtnGhost>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {poll.options.map(opt => {
          const voted  = myVotes.includes(opt.id);
          const pct    = Math.round((opt.votes.length/maxVotes)*100);
          const winner = !poll.open && opt.votes.length===maxVotes && opt.votes.length>0;
          return (
            <div key={opt.id} onClick={()=>{ if(poll.open) onVote(poll.id,opt.id,poll.multi); }}
              style={{ cursor:poll.open?"pointer":"default", borderRadius:6, border:`1px solid ${voted?C.accent:winner?C.accentD:C.border}`, overflow:"hidden", background:voted?C.accent+"11":winner?"#eaf2e3":"none" }}>
              <div style={{ padding:"10px 12px", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct}%`, background:voted?C.accent+"22":C.line+"99", transition:"width .4s", borderRadius:6 }}/>
                <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:18, height:18, borderRadius:poll.multi?3:"50%", border:`2px solid ${voted?C.accent:C.border}`, background:voted?C.accent:"none", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {voted && <span style={{ fontSize:10, color:C.black, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, color:C.text }}>{opt.text}</span>
                    {winner && <Tag color={C.accentD}>Ganadora</Tag>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:12, color:C.muted }}>{opt.votes.length}</span>
                    {opt.votes.slice(0,4).map((v,i)=><span key={i} style={{ marginLeft:i>0?-6:4, zIndex:i }}><Av name={v} size={20} on={v===ME}/></span>)}
                    {opt.votes.length>4 && <span style={{ fontSize:10, color:C.faint }}>+{opt.votes.length-4}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {poll.open && <div style={{ fontSize:11, color:C.faint, marginTop:10, fontStyle:"italic" }}>{poll.multi?"Puedes seleccionar varias opciones":"Selecciona una opción"} · Toca para votar</div>}
    </Card>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function CollaApp() {
  const [section, setSection]   = useState(null);
  const [loading, setLoading]   = useState(true);

  // Firebase state
  const [events,   setEvents]   = useState([]);
  const [compras,  setCompras]  = useState([]);
  const [turns,    setTurns]    = useState([]);
  const [quotas,   setQuotas]   = useState([]);
  const [shopping, setShopping] = useState([]);

  const [activeEvent, setAE]    = useState(null);
  const [editTurnIdx, setETI]   = useState(null);
  const [turnNote,    setTurnNote] = useState("");

  const [mEvento,  setMEvento]  = useState(false);
  const [mCompra,  setMCompra]  = useState(false);
  const [mEExp,    setMEExp]    = useState(null);
  const [mShop,    setMShop]    = useState(false);
  const [mPoll,    setMPoll]    = useState(false);

  const [newEv,   setNEv]  = useState({ title:"", type:"comida", date:"", time:"", description:"", agenda:"" });
  const [newCo,   setNCo]  = useState({ who:ME, what:"", amount:"" });
  const [newEE,   setNEE]  = useState({ who:ME, what:"", amount:"" });
  const [newSh,   setNSh]  = useState({ text:"" });
  const [newPoll, setNPoll] = useState({ title:"", multi:false, options:["","",""] });

  const ESTATUTOS_URL = "https://example.com/estatutos-colla.pdf";

  // ── Firebase listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [];

    const listen = (col, setter) => {
      const unsub = onSnapshot(collection(db, col), snap => {
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      unsubs.push(unsub);
    };

    listen("events",   setEvents);
    listen("compras",  setCompras);
    listen("turns",    setTurns);
    listen("quotas",   setQuotas);
    listen("shopping", setShopping);

    setTimeout(() => setLoading(false), 1500);
    return () => unsubs.forEach(u => u());
  }, []);

  const goBack = () => { setSection(null); setAE(null); };

  // ── Event actions ─────────────────────────────────────────────────────────
  const addEvento = async () => {
    if (!newEv.title || !newEv.date) return;
    const id = "ev_" + Date.now();
    await setDoc(doc(db, "events", id), { ...newEv, attendees:[], expenses:[], polls:[], createdAt: Date.now() });
    setNEv({ title:"", type:"comida", date:"", time:"", description:"", agenda:"" });
    setMEvento(false);
  };

  const toggleAtt = async (eid, mid) => {
    const ev = events.find(e=>e.id===eid);
    if (!ev) return;
    const attendees = ev.attendees.includes(mid) ? ev.attendees.filter(x=>x!==mid) : [...ev.attendees, mid];
    await updateDoc(doc(db, "events", eid), { attendees });
  };

  const addEventExp = async eid => {
    if (!newEE.what || !newEE.amount) return;
    const ev = events.find(e=>e.id===eid);
    if (!ev) return;
    const expenses = [...(ev.expenses||[]), { ...newEE, id: Date.now(), amount: parseFloat(newEE.amount) }];
    await updateDoc(doc(db, "events", eid), { expenses });
    setNEE({ who:ME, what:"", amount:"" });
    setMEExp(null);
  };

  // ── Poll actions ──────────────────────────────────────────────────────────
  const vote = async (eid, pollId, optId, multi) => {
    const ev = events.find(e=>e.id===eid);
    if (!ev) return;
    const polls = ev.polls.map(p => {
      if (p.id !== pollId) return p;
      return { ...p, options: p.options.map(o => {
        if (multi) { if(o.id!==optId) return o; return { ...o, votes:o.votes.includes(ME)?o.votes.filter(v=>v!==ME):[...o.votes,ME] }; }
        else { if(o.id===optId) return { ...o, votes:o.votes.includes(ME)?o.votes.filter(v=>v!==ME):[...o.votes,ME] }; return { ...o, votes:o.votes.filter(v=>v!==ME) }; }
      })};
    });
    await updateDoc(doc(db, "events", eid), { polls });
  };

  const closePoll = async (eid, pollId) => {
    const ev = events.find(e=>e.id===eid);
    if (!ev) return;
    const polls = ev.polls.map(p=>p.id===pollId?{ ...p,open:false }:p);
    await updateDoc(doc(db, "events", eid), { polls });
  };

  const addPoll = async eid => {
    if (!newPoll.title) return;
    const opts = newPoll.options.filter(o=>o.trim()).map((text,i)=>({ id:i+1,text,votes:[] }));
    if (opts.length < 2) return;
    const ev = events.find(e=>e.id===eid);
    if (!ev) return;
    const polls = [...(ev.polls||[]), { ...newPoll, id:Date.now(), createdBy:ME, open:true, options:opts }];
    await updateDoc(doc(db, "events", eid), { polls });
    setNPoll({ title:"", multi:false, options:["","",""] });
    setMPoll(false);
  };

  // ── Caja actions ──────────────────────────────────────────────────────────
  const addCompra = async () => {
    if (!newCo.what || !newCo.amount) return;
    const id = "co_" + Date.now();
    await setDoc(doc(db, "compras", id), { ...newCo, amount:parseFloat(newCo.amount), date:new Date().toISOString().split("T")[0], reintegrated:false, confirmedBy:null });
    setNCo({ who:ME, what:"", amount:"" });
    setMCompra(false);
  };

  const reintegrate = async id => await updateDoc(doc(db, "compras", id), { reintegrated:true });
  const confirmComp = async id => await updateDoc(doc(db, "compras", id), { confirmedBy:TREASURER });

  // ── Quota actions ─────────────────────────────────────────────────────────
  const declarePaid = async (qid, name) => {
    const q = quotas.find(x=>x.id===qid);
    if (!q) return;
    const payments = q.payments.map(p=>p.name!==name?p:{ ...p, selfDeclared:!p.selfDeclared, confirmedByTreasurer:false });
    await updateDoc(doc(db, "quotas", qid), { payments });
  };

  const confirmPay = async (qid, name) => {
    const q = quotas.find(x=>x.id===qid);
    if (!q) return;
    const payments = q.payments.map(p=>p.name!==name?p:{ ...p, confirmedByTreasurer:!p.confirmedByTreasurer });
    await updateDoc(doc(db, "quotas", qid), { payments });
  };

  // ── Shopping ──────────────────────────────────────────────────────────────
  const addShop = async () => {
    if (!newSh.text.trim()) return;
    const id = "sh_" + Date.now();
    await setDoc(doc(db, "shopping", id), { text:newSh.text.trim(), done:false, addedBy:ME });
    setNSh({ text:"" });
    setMShop(false);
  };

  const toggleShop = async id => {
    const item = shopping.find(s=>s.id===id);
    if (!item) return;
    await updateDoc(doc(db, "shopping", id), { done:!item.done });
  };

  const removeShop = async id => await deleteDoc(doc(db, "shopping", id));

  // ── Turns ─────────────────────────────────────────────────────────────────
  const saveTurnNote = async idx => {
    const t = turns[idx];
    if (!t) return;
    await updateDoc(doc(db, "turns", t.id), { note:turnNote, done:true });
    setETI(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MENÚ PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────

  const MENU_ITEMS = [
    { key:"eventos", label:"Eventos", num:"01" },
    { key:"caja",    label:"Caja",    num:"02" },
    { key:"compra",  label:"Compra",  num:"03" },
    { key:"turnos",  label:"Turnos",  num:"04" },
    { key:"cuotas",  label:"Cuotas",  num:"05" },
    { key:"colla",   label:"Colla",   num:"06" },
  ];

  const openPolls     = events.reduce((s,e)=>s+(e.polls||[]).filter(p=>p.open).length,0);
  const pendReintegro = compras.filter(c=>!c.reintegrated).length;
  const pendCuotas    = quotas.reduce((s,q)=>s+(q.payments||[]).filter(p=>!p.confirmedByTreasurer&&p.selfDeclared).length,0);
  const pendCompra    = shopping.filter(s=>!s.done).length;

  const badges = {
    eventos: openPolls>0 ? openPolls : null,
    caja:    pendReintegro>0 ? pendReintegro : null,
    compra:  pendCompra>0 ? pendCompra : null,
    cuotas:  pendCuotas>0 ? pendCuotas : null,
  };

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
        <div style={{ fontFamily:F.head, fontSize:48, color:C.text, letterSpacing:3 }}>LA COLLA</div>
        <Spinner/>
        <div style={{ fontSize:11, color:C.faint, letterSpacing:3, textTransform:"uppercase" }}>Cargando...</div>
      </div>
    </>
  );

  const MainMenu = () => (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"36px 28px 28px", borderBottom:`1px solid ${C.border}`, background:C.paper }}>
        <div style={{ fontSize:9, letterSpacing:5, color:C.faint, textTransform:"uppercase", marginBottom:8, fontFamily:F.body }}>Castellón de la Plana</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:F.head, fontSize:48, color:C.text, letterSpacing:3, lineHeight:1 }}>LA COLLA</div>
          <div style={{ width:10, height:10, borderRadius:"50%", background:C.accent, flexShrink:0, marginTop:4 }}/>
        </div>
      </div>
      <div style={{ flex:1, padding:"0 28px" }}>
        {MENU_ITEMS.map((item) => (
          <div key={item.key} className="menu-row" onClick={()=>setSection(item.key)}
            style={{ borderBottom:`1px solid ${C.line}`, padding:"22px 0", display:"flex", alignItems:"baseline", gap:16, position:"relative" }}>
            <span className="menu-num" style={{ fontFamily:F.body, fontSize:11, color:C.faint, letterSpacing:2, minWidth:24, transition:"color .15s" }}>{item.num}</span>
            <span className="menu-label" style={{ fontFamily:F.head, fontSize:44, color:C.text, letterSpacing:1, lineHeight:1, flex:1, transition:"color .15s" }}>{item.label}</span>
            {badges[item.key] && (
              <span style={{ width:22, height:22, borderRadius:"50%", background:C.accent, color:C.black, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.body, flexShrink:0 }}>{badges[item.key]}</span>
            )}
            <span style={{ fontFamily:F.head, fontSize:20, color:C.faint }}>›</span>
          </div>
        ))}
      </div>
      <div style={{ padding:"20px 28px", borderTop:`1px solid ${C.line}` }}>
        <div style={{ fontSize:10, color:C.faint, letterSpacing:2, fontFamily:F.body }}>{MEMBERS.length} miembros · Tesorero: {TREASURER}</div>
      </div>
    </div>
  );

  // ── EVENTOS ───────────────────────────────────────────────────────────────
  const SecEventos = () => {
    if (activeEvent) {
      const ev = events.find(e=>e.id===activeEvent);
      if (!ev) return null;
      const total   = (ev.expenses||[]).reduce((s,x)=>s+x.amount,0);
      const perHead = ev.attendees.length>0&&total>0?(total/ev.attendees.length).toFixed(2):null;
      const { day, mon, wday } = fmtD(ev.date);
      const etype = EVENT_TYPES[ev.type]||EVENT_TYPES.otro;
      const isReu = ev.type==="reunion";
      return (
        <div style={{ minHeight:"100vh", background:C.bg }}>
          <div style={{ background:C.paper, borderBottom:`1px solid ${C.border}`, padding:"20px 20px 16px", position:"sticky", top:0, zIndex:200 }}>
            <BackBtn onClick={()=>setAE(null)} label="Eventos"/>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}><Tag color={etype.color}>{etype.label}</Tag></div>
            <div style={{ fontFamily:F.head, fontSize:34, letterSpacing:1, color:C.text, lineHeight:1 }}>{ev.title}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4, textTransform:"capitalize" }}>{wday} {day} {mon} · {ev.time}</div>
          </div>
          <div style={{ padding:"20px 20px 80px" }}>
            {ev.description&&<div style={{ fontSize:13,color:C.muted,fontStyle:"italic",marginBottom:18 }}>{ev.description}</div>}
            {isReu&&ev.agenda&&(<><Lbl>Orden del día</Lbl><Card noHover style={{ background:C.warnL,border:`1px solid ${C.warn}33`,marginBottom:18 }}><div style={{ fontSize:13,color:C.text,whiteSpace:"pre-line",lineHeight:1.7 }}>{ev.agenda}</div></Card></>)}
            {(ev.polls||[]).length>0&&(<><Lbl>Votaciones</Lbl>{ev.polls.map(p=><PollWidget key={p.id} poll={p} onVote={(pid,oid,multi)=>vote(ev.id,pid,oid,multi)} onClose={(pid)=>closePoll(ev.id,pid)}/>)}</>)}
            <button onClick={()=>setMPoll(true)} style={{ width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:6,padding:11,color:C.muted,fontSize:10,letterSpacing:2.5,textTransform:"uppercase",cursor:"pointer",fontFamily:F.body,marginBottom:20 }}>+ Nueva votación</button>
            <Lbl>Apuntados ({ev.attendees.length})</Lbl>
            <Card><div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{MEMBERS.map(m=>{ const on=ev.attendees.includes(m.id); return (<span key={m.id} className={`pill ${on?"pill-on":""}`} onClick={()=>toggleAtt(ev.id,m.id)} style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:12,fontFamily:F.body }}><Av name={m.name} size={16} on={on}/>{m.name}</span>); })}</div></Card>
            {!isReu&&(<>
              <Lbl mt={18}>Gastos del evento</Lbl>
              {(ev.expenses||[]).length===0&&<div style={{ fontSize:13,color:C.faint,fontStyle:"italic",marginBottom:10 }}>Sin gastos registrados.</div>}
              {(ev.expenses||[]).map((x,i)=>(<Card key={i} noHover><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div><div style={{ fontSize:14,color:C.text,marginBottom:3 }}>{x.what}</div><div style={{ fontSize:12,color:C.muted }}>Pagó {x.who}</div></div><div style={{ fontFamily:F.head,fontSize:24,color:C.text }}>{x.amount.toFixed(2)} €</div></div></Card>))}
              <button onClick={()=>setMEExp(ev.id)} style={{ width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:6,padding:11,color:C.muted,fontSize:10,letterSpacing:2.5,textTransform:"uppercase",cursor:"pointer",fontFamily:F.body,marginBottom:16 }}>+ Añadir gasto</button>
              {perHead&&(<Card style={{ background:C.black,border:"none" }} noHover><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div><div style={{ fontSize:9,letterSpacing:3,color:C.faint,textTransform:"uppercase",marginBottom:4 }}>Total evento</div><div style={{ fontFamily:F.head,fontSize:32,color:"#fff" }}>{total.toFixed(2)} €</div></div><div style={{ textAlign:"right" }}><div style={{ fontSize:9,letterSpacing:3,color:C.faint,textTransform:"uppercase",marginBottom:4 }}>Por persona</div><div style={{ fontFamily:F.head,fontSize:32,color:C.accent }}>{perHead} €</div></div></div><div style={{ fontSize:11,color:C.faint,marginTop:8 }}>Entre {ev.attendees.length} asistentes</div></Card>)}
            </>)}
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight:"100vh", background:C.bg }}>
        <SectionHeader title="Eventos" onBack={goBack}/>
        <div style={{ padding:"20px 20px 80px" }}>
          <Lbl>Próximos eventos</Lbl>
          {[...events].sort((a,b)=>a.date>b.date?1:-1).map(ev=>{
            const { day, mon } = fmtD(ev.date);
            const total = (ev.expenses||[]).reduce((s,x)=>s+x.amount,0);
            const etype = EVENT_TYPES[ev.type]||EVENT_TYPES.otro;
            const openP = (ev.polls||[]).filter(p=>p.open).length;
            return (
              <Card key={ev.id} onClick={()=>setAE(ev.id)}>
                <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                  <div style={{ textAlign:"center",minWidth:42,flexShrink:0 }}>
                    <div style={{ fontFamily:F.head,fontSize:34,lineHeight:1,color:C.text }}>{day}</div>
                    <div style={{ fontSize:9,letterSpacing:2,textTransform:"uppercase",color:C.faint }}>{mon}</div>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap" }}>
                      <div style={{ fontFamily:F.head,fontSize:21,color:C.text,letterSpacing:.5 }}>{ev.title}</div>
                      <Tag color={etype.color}>{etype.label}</Tag>
                    </div>
                    {ev.description&&<div style={{ fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:8 }}>{ev.description}</div>}
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      <Tag>{ev.attendees.length} apuntados</Tag>
                      {total>0&&<Tag color={C.accentD}>{total.toFixed(2)} €</Tag>}
                      {openP>0&&<Tag color="#5a6ea8">{openP} votación{openP>1?"es":""}</Tag>}
                      {ev.type==="reunion"&&ev.agenda&&<Tag color={C.warn}>Orden del día</Tag>}
                    </div>
                    {ev.attendees.length>0&&<div style={{ marginTop:8,display:"flex",gap:3,flexWrap:"wrap" }}>{ev.attendees.slice(0,9).map(id=>{ const m=MEMBERS.find(x=>x.id===id); return <Av key={id} name={m?.name} size={22} on/>; })}{ev.attendees.length>9&&<span style={{ fontSize:11,color:C.faint,alignSelf:"center" }}>+{ev.attendees.length-9}</span>}</div>}
                  </div>
                  <span style={{ color:C.faint,fontSize:20,alignSelf:"center" }}>›</span>
                </div>
              </Card>
            );
          })}
          {events.length===0&&<div style={{ fontSize:13,color:C.faint,fontStyle:"italic" }}>Sin eventos aún. Crea el primero.</div>}
        </div>
        <button className="fab" onClick={()=>setMEvento(true)} style={{ position:"fixed",bottom:28,right:20,width:54,height:54,borderRadius:"50%",background:C.accent,color:C.black,border:"none",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(127,255,0,.4)",fontWeight:700,zIndex:100 }}>+</button>
      </div>
    );
  };

  // ── CAJA ──────────────────────────────────────────────────────────────────
  const SecCaja = () => {
    const totalC = compras.reduce((s,c)=>s+c.amount,0);
    const pend   = compras.filter(c=>!c.reintegrated);
    return (
      <div style={{ minHeight:"100vh", background:C.bg }}>
        <SectionHeader title="Caja" onBack={goBack}/>
        <div style={{ padding:"20px 20px 80px" }}>
          <Card style={{ background:C.black,border:"none",marginBottom:20 }} noHover>
            <div style={{ fontSize:9,letterSpacing:4,color:C.faint,textTransform:"uppercase",marginBottom:4 }}>Compras este mes</div>
            <div style={{ fontFamily:F.head,fontSize:44,color:C.accent,letterSpacing:2,lineHeight:1 }}>{totalC.toFixed(2)} €</div>
            <div style={{ fontSize:11,color:C.faint,marginTop:6 }}>{pend.length} pendiente{pend.length!==1?"s":""} de reintegro</div>
          </Card>
          <Lbl>Compras puntuales</Lbl>
          {pend.length>0&&<div style={{ fontSize:12,color:C.warn,background:C.warnL,border:`1px solid ${C.warn}33`,borderRadius:6,padding:"8px 12px",marginBottom:10 }}>{pend.length} compra{pend.length>1?"s":""} pendiente{pend.length>1?"s":""} de reintegro</div>}
          {compras.map(c=>(<Card key={c.id} noHover><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}><div style={{ flex:1,paddingRight:10 }}><div style={{ fontSize:14,color:C.text,marginBottom:3 }}>{c.what}</div><div style={{ fontSize:12,color:C.muted }}>Pagó {c.who} · {c.date}</div></div><div style={{ fontFamily:F.head,fontSize:22,color:C.text }}>{c.amount.toFixed(2)} €</div></div><div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>{c.reintegrated?<Tag color={C.accentD}>Reintegrado</Tag>:<><Tag color={C.warn}>Pendiente reintegro</Tag><BtnGhost onClick={()=>reintegrate(c.id)} style={{ fontSize:9,padding:"4px 10px" }}>Marcar reintegrado</BtnGhost></>}{c.confirmedBy?<Tag color={C.accentD}>Confirmado · {c.confirmedBy}</Tag>:isTR()&&<BtnGhost onClick={()=>confirmComp(c.id)} style={{ fontSize:9,padding:"4px 10px" }}>✓ Confirmar</BtnGhost>}</div></Card>))}
          {compras.length===0&&<div style={{ fontSize:13,color:C.faint,fontStyle:"italic",marginBottom:16 }}>Sin compras registradas.</div>}
          <button onClick={()=>setMCompra(true)} style={{ width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:6,padding:13,color:C.muted,fontSize:10,letterSpacing:2.5,textTransform:"uppercase",cursor:"pointer",fontFamily:F.body }}>+ Registrar compra</button>
        </div>
      </div>
    );
  };

  // ── COMPRA ────────────────────────────────────────────────────────────────
  const SecCompra = () => {
    const pending = shopping.filter(s=>!s.done);
    const done    = shopping.filter(s=>s.done);
    return (
      <div style={{ minHeight:"100vh", background:C.bg }}>
        <SectionHeader title="Compra" onBack={goBack}/>
        <div style={{ padding:"20px 20px 80px" }}>
          <Lbl>Necesidades del local ({pending.length} pendientes)</Lbl>
          {pending.length===0&&<div style={{ fontSize:13,color:C.faint,fontStyle:"italic",marginBottom:10 }}>Todo en orden.</div>}
          {pending.map(item=>(<div key={item.id} style={{ display:"flex",alignItems:"center",gap:12,background:C.paper,border:`1px solid ${C.border}`,borderRadius:6,padding:"13px 16px",marginBottom:8 }}><button onClick={()=>toggleShop(item.id)} style={{ width:22,height:22,borderRadius:4,border:`2px solid ${C.border}`,background:"none",cursor:"pointer",flexShrink:0 }}/><div style={{ flex:1 }}><div style={{ fontSize:14,color:C.text }}>{item.text}</div><div style={{ fontSize:11,color:C.faint,marginTop:2 }}>Añadido por {item.addedBy}</div></div><button onClick={()=>removeShop(item.id)} style={{ background:"none",border:"none",color:C.faint,fontSize:20,cursor:"pointer",lineHeight:1 }}>×</button></div>))}
          {done.length>0&&(<><Lbl mt={20}>Comprado</Lbl>{done.map(item=>(<div key={item.id} style={{ display:"flex",alignItems:"center",gap:12,background:C.paper,border:`1px solid ${C.line}`,borderRadius:6,padding:"13px 16px",marginBottom:8,opacity:.55 }}><button onClick={()=>toggleShop(item.id)} style={{ width:22,height:22,borderRadius:4,border:`2px solid ${C.accent}`,background:C.accent,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.black,fontWeight:700 }}>✓</button><div style={{ flex:1,textDecoration:"line-through",color:C.muted,fontSize:14 }}>{item.text}</div><button onClick={()=>removeShop(item.id)} style={{ background:"none",border:"none",color:C.faint,fontSize:20,cursor:"pointer",lineHeight:1 }}>×</button></div>))}</>)}
        </div>
        <button className="fab" onClick={()=>setMShop(true)} style={{ position:"fixed",bottom:28,right:20,width:54,height:54,borderRadius:"50%",background:C.accent,color:C.black,border:"none",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(127,255,0,.4)",fontWeight:700,zIndex:100 }}>+</button>
      </div>
    );
  };

  // ── TURNOS ────────────────────────────────────────────────────────────────
  const SecTurnos = () => (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <SectionHeader title="Turnos" onBack={goBack}/>
      <div style={{ padding:"20px 20px 80px" }}>
        <Lbl>Limpieza y compra · por grupo</Lbl>
        {turns.map((t,i)=>{
          const group=gg(t.group); const now=i===0; const isEdit=editTurnIdx===i;
          return (
            <Card key={t.id||i} noHover style={{ borderLeft:`4px solid ${now?C.accent:C.border}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:t.note||isEdit?12:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ display:"flex" }}>{group?.members.map((n,ni)=>(<span key={ni} style={{ marginLeft:ni>0?-8:0,zIndex:ni,position:"relative" }}><Av name={n} size={30} on={now}/></span>))}</div>
                  <div><div style={{ fontSize:14,fontWeight:now?600:400,color:now?C.text:C.muted,fontFamily:F.body }}>{group?.members.join(" & ")}</div><div style={{ display:"flex",gap:6,marginTop:3,flexWrap:"wrap" }}>{now&&<Tag>Esta semana</Tag>}{t.done&&<Tag color={C.accentD}>Completado</Tag>}</div></div>
                </div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:11,color:C.faint,marginBottom:6 }}>{t.week}</div>{now&&!isEdit&&<BtnGhost onClick={()=>{ setETI(i); setTurnNote(t.note||""); }} style={{ fontSize:9,padding:"4px 10px" }}>+ Nota</BtnGhost>}</div>
              </div>
              {isEdit&&(<><textarea value={turnNote} onChange={e=>setTurnNote(e.target.value)} placeholder="Ej: Falta lejía." rows={3} style={{ width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"10px 12px",color:C.text,fontSize:13,fontFamily:F.body,resize:"none" }}/><div style={{ display:"flex",gap:8,marginTop:8,justifyContent:"flex-end" }}><BtnGhost onClick={()=>setETI(null)}>Cancelar</BtnGhost><BtnAccent onClick={()=>saveTurnNote(i)}>Guardar</BtnAccent></div></>)}
              {!isEdit&&t.note&&<div style={{ fontSize:13,color:C.muted,background:C.bg,borderRadius:5,padding:"10px 12px",lineHeight:1.5,fontStyle:"italic" }}>{t.note}</div>}
            </Card>
          );
        })}
        {turns.length===0&&<div style={{ fontSize:13,color:C.faint,fontStyle:"italic" }}>Sin turnos configurados.</div>}
      </div>
    </div>
  );

  // ── CUOTAS ────────────────────────────────────────────────────────────────
  const SecCuotas = () => (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <SectionHeader title="Cuotas" onBack={goBack}/>
      <div style={{ padding:"20px 20px 80px" }}>
        {isTR()&&<div style={{ fontSize:12,color:C.accentD,background:C.accent+"22",border:`1px solid ${C.accent}55`,borderRadius:6,padding:"8px 12px",marginBottom:16 }}>Modo tesorero activo · Puedes confirmar pagos</div>}
        {quotas.map(q=>{
          const confirmed=(q.payments||[]).filter(p=>p.confirmedByTreasurer).length;
          const declared=(q.payments||[]).filter(p=>p.selfDeclared).length;
          const pct=Math.round((confirmed/MEMBERS.length)*100);
          return (
            <div key={q.id} style={{ marginBottom:24 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8 }}><div><Lbl>{q.month}</Lbl><div style={{ fontFamily:F.head,fontSize:24,color:C.text }}>{q.concept} · {q.amount} €</div></div><Tag color={pct===100?C.accentD:C.warn}>{confirmed}/{MEMBERS.length}</Tag></div>
              <div style={{ height:5,background:C.line,borderRadius:3,marginBottom:4,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,background:C.accent,borderRadius:3,transition:"width .4s" }}/></div>
              <div style={{ fontSize:10,color:C.faint,marginBottom:12,letterSpacing:1 }}>{declared} declarados · {confirmed} confirmados</div>
              <Card style={{ padding:"0 16px" }} noHover>
                {(q.payments||[]).map((p,i)=>{
                  const isMe=p.name===ME;
                  return (
                    <div key={p.name} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<(q.payments||[]).length-1?`1px solid ${C.line}`:"none" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}><Av name={p.name} size={26} on={p.confirmedByTreasurer}/><div><div style={{ fontSize:14,color:p.confirmedByTreasurer?C.text:C.muted }}>{p.name}</div>{p.selfDeclared&&!p.confirmedByTreasurer&&<div style={{ fontSize:10,color:C.warn,marginTop:1 }}>Pendiente de confirmar</div>}</div></div>
                      <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                        {p.confirmedByTreasurer?<Tag color={C.accentD}>Confirmado</Tag>:p.selfDeclared?<><Tag color={C.warn}>Declarado</Tag>{isTR()&&<BtnGhost onClick={()=>confirmPay(q.id,p.name)} style={{ fontSize:9,padding:"3px 8px" }}>✓</BtnGhost>}</>:isMe?<BtnAccent onClick={()=>declarePaid(q.id,p.name)} style={{ fontSize:9,padding:"5px 12px" }}>He pagado</BtnAccent>:<Tag color={C.neg}>Pendiente</Tag>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })}
        {quotas.length===0&&<div style={{ fontSize:13,color:C.faint,fontStyle:"italic" }}>Sin cuotas configuradas.</div>}
      </div>
    </div>
  );

  // ── COLLA ─────────────────────────────────────────────────────────────────
  const SecColla = () => (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <SectionHeader title="Colla" onBack={goBack}/>
      <div style={{ padding:"20px 20px 80px" }}>
        <Card style={{ background:C.black,border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }} noHover>
          <div><div style={{ fontSize:9,letterSpacing:4,color:C.faint,textTransform:"uppercase",marginBottom:4 }}>Total</div><div style={{ fontFamily:F.head,fontSize:36,color:C.accent }}>{MEMBERS.length} miembros</div></div>
          <div style={{ textAlign:"right" }}><div style={{ fontSize:9,letterSpacing:4,color:C.faint,textTransform:"uppercase",marginBottom:4 }}>Tesorero</div><div style={{ fontFamily:F.head,fontSize:22,color:"#fff" }}>{TREASURER}</div></div>
        </Card>
        <Lbl>Miembros</Lbl>
        {GROUPS.map(g=>(<Card key={g.id} noHover style={{ display:"flex",alignItems:"center",gap:14 }}><div style={{ display:"flex" }}>{g.members.map((n,i)=>(<span key={i} style={{ marginLeft:i>0?-8:0,zIndex:i,position:"relative" }}><Av name={n} size={36} on={i===0}/></span>))}</div><div style={{ fontSize:15,color:C.text,fontWeight:500 }}>{g.members.join(" & ")}</div></Card>))}
        <Divider mt={20} mb={16}/>
        <Lbl>Documentos</Lbl>
        <Card noHover style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div><div style={{ fontSize:14,color:C.text,marginBottom:3 }}>Estatutos de la colla</div><div style={{ fontSize:11,color:C.faint }}>Documento oficial · PDF</div></div>
          <a href={ESTATUTOS_URL} target="_blank" rel="noreferrer"><BtnAccent>Ver PDF</BtnAccent></a>
        </Card>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div style={{ maxWidth:480, margin:"0 auto", fontFamily:F.body, color:C.text }}>
        {!section && <MainMenu/>}
        {section==="eventos" && <SecEventos/>}
        {section==="caja"    && <SecCaja/>}
        {section==="compra"  && <SecCompra/>}
        {section==="turnos"  && <SecTurnos/>}
        {section==="cuotas"  && <SecCuotas/>}
        {section==="colla"   && <SecColla/>}

        {mEvento&&(<Modal title="Nuevo evento" onClose={()=>setMEvento(false)} onConfirm={addEvento} btnLabel="Crear">
          <Lbl>Tipo</Lbl>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>{Object.entries(EVENT_TYPES).map(([key,val])=>(<span key={key} className={`pill ${newEv.type===key?"pill-on":""}`} onClick={()=>setNEv({...newEv,type:key})} style={{ padding:"6px 14px",borderRadius:20,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:12,fontFamily:F.body }}>{val.label}</span>))}</div>
          <Inp label="Título" placeholder="Ej: Paella valenciana" value={newEv.title} onChange={e=>setNEv({...newEv,title:e.target.value})}/>
          <Inp label="Fecha" type="date" value={newEv.date} onChange={e=>setNEv({...newEv,date:e.target.value})}/>
          <Inp label="Hora" type="time" value={newEv.time} onChange={e=>setNEv({...newEv,time:e.target.value})}/>
          <Inp label="Descripción" placeholder="Detalles..." value={newEv.description} onChange={e=>setNEv({...newEv,description:e.target.value})}/>
          {newEv.type==="reunion"&&<Inp label="Orden del día" multiline placeholder={"1. Punto uno\n2. Punto dos"} value={newEv.agenda} onChange={e=>setNEv({...newEv,agenda:e.target.value})}/>}
        </Modal>)}

        {mPoll&&activeEvent&&(<Modal title="Nueva votación" onClose={()=>setMPoll(false)} onConfirm={()=>addPoll(activeEvent)} btnLabel="Crear">
          <Inp label="Pregunta" placeholder="Ej: ¿Qué día preferís?" value={newPoll.title} onChange={e=>setNPoll({...newPoll,title:e.target.value})}/>
          <Lbl>Tipo de voto</Lbl>
          <div style={{ display:"flex",gap:8,marginBottom:14 }}>{[{k:false,l:"Una opción"},{k:true,l:"Varias opciones"}].map(o=>(<span key={String(o.k)} className={`pill ${newPoll.multi===o.k?"pill-on":""}`} onClick={()=>setNPoll({...newPoll,multi:o.k})} style={{ flex:1,padding:"9px 0",textAlign:"center",borderRadius:6,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:12,fontFamily:F.body }}>{o.l}</span>))}</div>
          <Lbl>Opciones (mínimo 2)</Lbl>
          {newPoll.options.map((opt,i)=>(<Inp key={i} placeholder={`Opción ${i+1}`} value={opt} onChange={e=>{ const o=[...newPoll.options]; o[i]=e.target.value; setNPoll({...newPoll,options:o}); }}/>))}
          <button onClick={()=>setNPoll({...newPoll,options:[...newPoll.options,""]})} style={{ background:"none",border:`1px dashed ${C.border}`,borderRadius:5,padding:"8px 0",width:"100%",color:C.muted,fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:F.body,marginBottom:8 }}>+ Añadir opción</button>
        </Modal>)}

        {mCompra&&(<Modal title="Registrar compra" onClose={()=>setMCompra(false)} onConfirm={addCompra} btnLabel="Añadir">
          <Inp label="Qué se compró" placeholder="Ej: Papel higiénico" value={newCo.what} onChange={e=>setNCo({...newCo,what:e.target.value})}/>
          <Inp label="Importe (€)" type="number" placeholder="0.00" value={newCo.amount} onChange={e=>setNCo({...newCo,amount:e.target.value})}/>
          <Lbl>Quién pagó</Lbl>
          <MemberPills selected={newCo.who} multi={false} onToggle={name=>setNCo({...newCo,who:name})}/>
        </Modal>)}

        {mEExp!==null&&(<Modal title="Gasto del evento" onClose={()=>setMEExp(null)} onConfirm={()=>addEventExp(mEExp)} btnLabel="Añadir">
          <Inp label="Qué se compró" placeholder="Ej: Arroz y verduras" value={newEE.what} onChange={e=>setNEE({...newEE,what:e.target.value})}/>
          <Inp label="Importe (€)" type="number" placeholder="0.00" value={newEE.amount} onChange={e=>setNEE({...newEE,amount:e.target.value})}/>
          <Lbl>Quién pagó</Lbl>
          <MemberPills selected={newEE.who} multi={false} onToggle={name=>setNEE({...newEE,who:name})}/>
        </Modal>)}

        {mShop&&(<Modal title="Añadir necesidad" onClose={()=>setMShop(false)} onConfirm={addShop} btnLabel="Añadir">
          <Inp label="Qué hace falta" placeholder="Ej: Lejía, bombilla..." value={newSh.text} onChange={e=>setNSh({text:e.target.value})}/>
        </Modal>)}
      </div>
    </>
  );
}
