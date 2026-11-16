import { useEffect, useRef, useState } from 'react'
type Msg = { id: string; from: string; text: string; time: string; type?: 'text'|'audio'|'photo'; audioUrl?: string; own?: boolean }
const USERS = [
  { id:'la-flaca', name:'La Flaca', last:'En línea', ip:'192.168.1.10', country:'Rep. Dominicana', city:'Santo Domingo', isp:'【entity-Claro¦canonical_name=Claro】' },
  { id:'papi-chulo', name:'Papi Chulo', last:'En línea', ip:'192.168.1.12', country:'Rep. Dominicana', city:'Santiago', isp:'Altice' },
  { id:'yailin', name:'Yailin Flow', last:'Última vez hace 5 min', ip:'192.168.1.15', country:'Colombia', city:'Barranquilla', isp:'Movistar' },
]
export default function App(){
  const [screen, setScreen] = useState<'login'|'chat'>(() => localStorage.getItem('gs_session') ? 'chat' : 'login')
  const [name, setName] = useState(() => localStorage.getItem('gs_name') || '')
  const [key, setKey] = useState('')
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('gs_admin') === '1')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<'grupo'|'privado'>('grupo')
  const [privateUser, setPrivateUser] = useState(USERS[0])
  const [showList, setShowList] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminTab, setAdminTab] = useState<'llaves'|'usuarios'|'privados'|'media'|'estado'|'cloud'|'ajustes'>('llaves')
  const [showMenu, setShowMenu] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleMin, setBubbleMin] = useState(false)
  const [spyUser, setSpyUser] = useState<any>(null)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [notifOn, setNotifOn] = useState(true)
  const [notifSound, setNotifSound] = useState('ding')
  const [drafts, setDrafts] = useState<Record<string,string>>({})
  const [groupMsgs, setGroupMsgs] = useState<Msg[]>([])
  const [privateMsgs, setPrivateMsgs] = useState<Record<string,Msg[]>>({})
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([])
  const [banned, setBanned] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [typing, setTyping] = useState('')
  const [recordingUser, setRecordingUser] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const currentKey = tab === 'grupo' ? 'grupo' : privateUser.id
  const draft = drafts[currentKey] || ''
  const currentMsgs = tab === 'grupo' ? groupMsgs : (privateMsgs[privateUser.id] || [])
  const doScroll = () => { if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }
  useEffect(()=>{ doScroll() }, [screen, tab, privateUser.id, groupMsgs.length, currentMsgs.length])
  const login = async () => {
    if(!name.trim() || !key.trim()){ setLoginError('Pon tu nombre y tu llave'); return }
    try{
      const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: name.trim(), key: key.trim() }) })
      const d = await r.json()
      if(!d.ok){ setLoginError('Llave incorrecta'); return }
      localStorage.setItem('gs_session','1'); localStorage.setItem('gs_name', name.trim()); localStorage.setItem('gs_admin', d.isAdmin ? '1':'0'); localStorage.setItem('gs_key', key.trim())
      setIsAdmin(d.isAdmin); setLoginError(''); setScreen('chat')
    }catch{ setLoginError('No se pudo conectar con el servidor'); }
  }
  const logout = () => { localStorage.clear(); setScreen('login'); setName(''); setKey('') }
  const sendText = () => {
    const t = draft.trim(); if(!t) return
    const m: Msg = { id: Date.now().toString(), from: 'Tú', text: t, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), own: true }
    if(tab==='grupo') setGroupMsgs(p=>[...p,m]); else setPrivateMsgs(p=>({...p,[privateUser.id]:[...(p[privateUser.id]||[]),m]}))
    setDrafts(d=>({...d,[currentKey]:''})); if(notifOn && navigator.vibrate) navigator.vibrate(50)
    }
    const onTyping = (v: string) => {
    setDrafts(d=>({...d,[currentKey]:v})); setTyping(name || 'Tú')
    setTimeout(()=>setTyping(''), 1500)
  }
  const startRec = async (e: any) => {
    e.preventDefault(); e.stopPropagation()
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream); chunksRef.current = []
      rec.ondataavailable = ev => { if(ev.data.size>0) chunksRef.current.push(ev.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:'audio/webm' }); const url = URL.createObjectURL(blob)
        const m: Msg = { id: Date.now().toString(), from: 'Tú', text:'Audio', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), type:'audio', audioUrl:url, own:true }
        if(tab==='grupo') setGroupMsgs(p=>[...p,m]); else setPrivateMsgs(p=>({...p,[privateUser.id]:[...(p[privateUser.id]||[]),m]}))
        stream.getTracks().forEach(t=>t.stop()); setIsRecording(false); setRecordingUser('')
      }
      recorderRef.current = rec; rec.start(); setIsRecording(true); setRecordingUser(name || 'Tú')
    }catch{ setIsRecording(false) }
  }
  const stopRec = (e: any) => { e.preventDefault(); e.stopPropagation(); if(recorderRef.current && recorderRef.current.state!=='inactive') recorderRef.current.stop() }
  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return
    const url = URL.createObjectURL(f)
    const m: Msg = { id: Date.now().toString(), from: 'Tú', text:url, time:'Ahora', type:'photo', own:true }
    if(tab==='grupo') setGroupMsgs(p=>[...p,m]); else setPrivateMsgs(p=>({...p,[privateUser.id]:[...(p[privateUser.id]||[]),m]}))
    e.target.value=''
  }
  const pickProfile = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f) return; setProfilePhoto(URL.createObjectURL(f)); e.target.value='' }
  const genKey = async () => {
    try{
      const adminKey = localStorage.getItem('gs_key') || ''
      const r = await fetch('/api/admin/keys', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({}) })
      const d = await r.json(); if(d.ok && d.key) { setGeneratedKeys(p=>[d.key.key, ...p]); return }
    }catch{}
    const k='GRUPO-'+Math.random().toString(36).slice(2,8).toUpperCase(); setGeneratedKeys(p=>[k,...p])
  }
  if(screen==='login') return (
    <div className="login"><div className="login-card"><div className="logo">S</div><h1>GRUPO SECRETO</h1><p>Entra con tu llave</p>
    <input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} />
    <input placeholder="Llave para entrar" type="password" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} />
    {loginError && <div className="err">{loginError}</div>}
    <button className="btn-red" onClick={login}>Entrar</button><small>Solo con llave. La llave de admin viene de Abasthan.</small></div></div>
  )
  const topName = tab==='privado' ? privateUser.name : 'GRUPO SECRETO'
  const topSub = recordingUser ? 'grabando audio...' : typing ? 'escribiendo...' : (tab==='privado' ? privateUser.last+' · privado' : 'En línea: 3')
  const spyMsgs  return (
    <div className="app">
      <header className="top">
        <div className="avatar">{profilePhoto ? <img src={profilePhoto} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : (tab==='privado' ? privateUser.name[0] : 'S')}</div>
        <div className="top-info"><b>{topName} {isAdmin && <span className="admin-badge">ADMIN</span>}</b><span className={typing||recordingUser?'typing-top':''}>{topSub}</span></div>
        <button className="icon" onClick={()=>{setShowBubble(true); setBubbleMin(false)}}>◉</button>
        <button className="icon" onClick={()=>setShowMenu(!showMenu)}>⋮</button>
      </header>
      {showMenu && <div className="menu"><button onClick={()=>{setShowMenu(false); setShowBubble(true); setBubbleMin(false)}}>◉ Burbuja</button><button onClick={()=>{setShowMenu(false); setShowAdmin(true)}}>Panel Admin</button><label className="menu-label">Mi foto <input type="file" accept="image/*" hidden onChange={pickProfile} /></label><button onClick={()=>{setShowMenu(false); logout()}}>Cerrar sesión</button><button onClick={()=>setShowMenu(false)}>Cerrar</button></div>}
      <div className="messages" ref={listRef}>{currentMsgs.length===0 && <div className="empty">Sin mensajes todavía. Sé el primero en escribir.</div>}
        {currentMsgs.map(m=>(
          <div key={m.id} className={`bubble ${m.own?'own':'other'}`}>{!m.own && <div className="from">{m.from}</div>}
          {m.type==='audio' && m.audioUrl ? <audio controls src={m.audioUrl}/> : m.type==='photo' ? <img src={m.text} style={{width:'100%',borderRadius:12}}/> : <div>{m.text}</div>}
          <div className="meta">{m.time} {m.own && <span className="ticks">✓✓</span>}</div></div>
        ))}
      </div>
      <div className="input-bar">
        <label className="icon-btn photo-btn" title="Enviar foto"[STRIPPED 12 bytes]"22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg><input type="file" accept="image/*" hidden onChange={pickPhoto} /></label>
        <textarea value={draft} onChange={e=>onTyping(e.target.value)} placeholder={tab==='grupo'?'Escribe algo duro...':`Escribe a ${privateUser.name}...`} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendText() } }} />
        <button className={`mic ${isRecording?'rec':''}`} onTouchStart={startRec} onTouchEnd={stopRec} onMouseDown={startRec} onMouseUp={stopRec} onContextMenu={e=>{e.preventDefault(); e.stopPropagation()}}>🎤</button>
        <button className="send" onClick={sendText}>➤</button>
      </div>
      <div className="side"><button onClick={()=>{setTab('privado'); setShowList(true)}}>P<br/>R<br/>I<br/>V<br/>A<br/>D<br/>O</button><button className="side-grupo" onClick={()=>setTab('grupo')}>G<br/>R<br/>U<br/>P<br/>O</button><button onClick={()=>setShowAdmin(true)}>A<br/>D<br/>M<br/>I<br/>N</button></div>
      {showList && <div className="sheet"><div className="sheet-head"><b>Chats / Usuarios</b><button onClick={()=>setShowList(false)}>✕</button></div><input placeholder="Buscar..." className="search" /><div className="sec">En línea</div>{USERS.map(u=><button key={u.id} className="user-row" onClick={()=>{setPrivateUser(u); setTab('privado'); setShowList(false)}}><span className="user-avatar">{u.name[0]}</span><span><b>{u.name}</b><small>{u.last} · {(privateMsgs[u.id]||[]).slice(-1)[0]?.text || 'Sin mensajes'}</small></span></button>)}</div>}
      {showAdmin && <div className="admin"><div className="admin-head"><b>Panel Admin</b><button onClick={()=>setShowAdmin(false)}>✕ CERRAR</button></div>
        <div className="admin-tabs">{(['llaves','usuarios','privados','media','estado','cloud','ajustes'] as const).map(t=><button key={t} className={adminTab===t?'active':''} onClick={()=>setAdminTab(t)}>{t}</button>)}</div>
        {adminTab==='llaves' && <><button className="btn-red" onClick={genKey}>Generar nueva llave</button>{generatedKeys.map(k=><div key={k} className="key-row">{k} <button onClick={()=>navigator.clipboard?.writeText(k)}>Copiar</button></div>)}</>}
        {adminTab==='usuarios' && USERS.map(u=><div key={u.id} className="user-row"><span className="user-avatar">{u.name[0]}</span><span><b>{u.name}</b><small>{u.ip} · {u.country} · {u.city} · {u.isp}</small></span><button onClick={()=>setBanned(p=>p.includes(u.id)?p.filter(x=>x!==u.id):[...p,u.id])}>{banned.includes(u.id)?'Perdonar':'Banear'}</button></div>)}
        {adminTab==='privados' && USERS.map(u=><div key={u.id} className="user-row"><span><b>{u.name} ↔ Grupo</b><small>Último: {(privateMsgs[u.id]||[]).slice(-1)[0]?.text || 'Sin mensajes'}</small></span><button onClick={()=>setSpyUser(u)}>Espiar DM invisible</button></div>)}
        {adminTab==='media' && <p>Fotos / audios / videos enviados aparecen aquí. Sin mensajes por defecto.</p>}
        {adminTab==='estado' && <p>En línea: 3 · Mensajes grupo: {groupMsgs.length} · Privados: {Object.values(privateMsgs).flat().length}</p>}
        {adminTab==='cloud' && <><input placeholder="Cloud Name" className="inp" /><input placeholder="API Key" className="inp" /><input placeholder="API Secret" className="inp" /><button className="btn-red">Guardar config</button></>}
        {adminTab==='ajustes' && <><input placeholder="Nombre del grupo" className="inp" /><input placeholder="Mensaje de bienvenida" className="inp" /><label>Notificaciones <input type="checkbox" checked={notifOn} onChange={e=>setNotifOn(e.target.checked)} /></label><select value={notifSound} onChange={e=>setNotifSound(e.target.value)}><option value="ding">Ding</option><option value="pop">Pop</option><option value="vibe">Vibración</option></select></>}
      </div>}
      {spyUser && <div className="admin"><div className="admin-head"><b>Espiar: {spyUser.name} (invisible)</b><button onClick={()=>setSpyUser(null)}>Volver a Admin</button></div>{spyMsgs.length===0 ? <p>Sin mensajes en este privado.</p> : spyMsgs.map(m=><div key={m.id} className={`bubble ${m.own?'own':'other'}`}><div>{m.text}</div><div className="meta">{m.time}</div></div>)}</div>}
      {bubbleMin && <button className="bubble-fab" onClick={()=>setBubbleMin(false)}>S</button>}
      {showBubble && !bubbleMin && <div className="bubble-window"><div className="bubble-top"><button onClick={()=>setBubbleMin(true)}>←</button><button className={tab==='grupo'?'active':''} onClick={()=>setTab('grupo')}>Grupo</button><button className={tab==='privado'?'active':''} onClick={()=>setTab('privado')}>Privado</button><button onClick={()=>setShowBubble(false)}>✕</button></div><div className="bubble-msgs">{currentMsgs.map(m=><div key={m.id} className={`bubble ${m.own?'own':'other'}`}><div>{m.text}</div><div className="meta">{m.time}</div></div>)}</div><div className="bubble-input"><input value={draft} onChange={e=>onTyping(e.target.value)} placeholder="Escribe..." /><button onClick={sendText}>➤</button></div></div>}
    </div>
  )
        } = spyUser ? (privateMsgs[spyUser.id] || []) : []
    
  
