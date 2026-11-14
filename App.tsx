import { useEffect, useRef, useState } from 'react'

type Msg = { id: string; from: string; text: string; time: string; type?: 'text'|'audio'; audioUrl?: string; own?: boolean }

const ME = 'Tú'
const DEMO_GROUP: Msg[] = [
  { id: '1', from: 'Yailin Flow', text: 'Mañana hacemos live en el grupo? Voten', time: '21:07' },
  { id: '2', from: 'Papi Chulo', text: 'Yo voto que sí. Que se arme el corito.', time: '21:08' },
]

const USERS = [
  { id: 'la-flaca', name: 'La Flaca', last: 'Últ. vez hace un tiempo' },
  { id: 'papi-chulo', name: 'Papi Chulo', last: 'En línea' },
  { id: 'yailin', name: 'Yailin Flow', last: 'Últ. vez hace un tiempo' },
]

export default function App(){
  const [screen, setScreen] = useState<'login'|'chat'>('login')
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<'grupo'|'privado'>('grupo')
  const [privateUser, setPrivateUser] = useState(USERS[0])
  const [showList, setShowList] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleMin, setBubbleMin] = useState(false)
  const [drafts, setDrafts] = useState<Record<string,string>>({})
  const [groupMsgs, setGroupMsgs] = useState<Msg[]>(DEMO_GROUP)
  const [privateMsgs, setPrivateMsgs] = useState<Record<string,Msg[]>>({
    'la-flaca': [{ id:'p1', from:'La Flaca', text:'Hola', time:'10:38 AM' }],
  })
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [typingUser, setTypingUser] = useState('')

  const listRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const currentKey = tab === 'grupo' ? 'grupo' : privateUser.id
  const draft = drafts[currentKey] || ''
  const currentMsgs = tab === 'grupo' ? groupMsgs : (privateMsgs[privateUser.id] || [])

  // AL ENTRAR: ir automático al mensaje más reciente
  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      if(ref.current) ref.current.scrollTop = ref.current.scrollHeight
      setTimeout(() => { if(ref.current) ref.current.scrollTop = ref.current.scrollHeight }, 300)
    })
  }
  useEffect(() => { if(screen==='chat') scrollToBottom(listRef) }, [screen, tab, privateUser.id])
  useEffect(() => { scrollToBottom(listRef) }, [groupMsgs.length, currentMsgs.length])
  useEffect(() => { if(showBubble) scrollToBottom(bubbleRef) }, [showBubble, currentMsgs.length])

  const login = () => {
    if(!name.trim() || !key.trim()){ setLoginError('Pon tu nombre y tu llave'); return }
    // En producción: fetch('/api/login', {method:'POST', body: JSON.stringify({name, key})})
    // La llave de admin vive solo en la variable ADMIN_KEY de Abasthan, no en el código.
    // Aquí en preview: cualquier llave no vacía entra, la de admin la marca el panel.
    setLoginError(''); setScreen('chat')
  }

  const sendText = () => {
    const t = draft.trim(); if(!t) return
    const m: Msg = { id: Date.now().toString(), from: ME, text: t, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), own: true }
    if(tab==='grupo') setGroupMsgs(p => [...p, m])
    else setPrivateMsgs(p => ({ ...p, [privateUser.id]: [...(p[privateUser.id]||[]), m] }))
    setDrafts(d => ({ ...d, [currentKey]: '' }))
    setTimeout(() => scrollToBottom(listRef), 50)
    if(showBubble) setTimeout(() => scrollToBottom(bubbleRef), 50)
  }

  // MIC: solo graba y envía, NUNCA abre popup de AUDIO / foto
  const startRec = async (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = ev => { if(ev.data.size>0) chunksRef.current.push(ev.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const m: Msg = { id: Date.now().toString(), from: ME, text: '🎤 Audio', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), type:'audio', audioUrl: url, own: true }
        if(tab==='grupo') setGroupMsgs(p => [...p, m])
        else setPrivateMsgs(p => ({ ...p, [privateUser.id]: [...(p[privateUser.id]||[]), m] }))
        stream.getTracks().forEach(t=>t.stop())
        setIsRecording(false); scrollToBottom(listRef)
      }
      recorderRef.current = rec; rec.start(); setIsRecording(true)
    }catch{ setIsRecording(false) }
  }
  const stopRec = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if(recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return
    const url = URL.createObjectURL(f)
    const m: Msg = { id: Date.now().toString(), from: ME, text: '📷 Foto', time: 'Ahora', own: true }
    if(tab==='grupo') setGroupMsgs(p => [...p, m])
    else setPrivateMsgs(p => ({ ...p, [privateUser.id]: [...(p[privateUser.id]||[]), m] }))
    e.target.value = ''
  }

  if(screen==='login') return (
    <div className="login">
      <div className="login-card">
        <div className="logo">S</div><h1>GRUPO SECRETO</h1><p>Entra con tu llave</p>
        <input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Llave para entrar" type="password" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} />
        {loginError && <div className="err">{loginError}</div>}
        <button className="btn-red" onClick={login}>Entrar</button>
        <small>Solo con llave. Sin llaves visibles aquí.</small>
      </div>
    </div>
  )

  return (
    <div className="app">
      {/* TOP UNICO: en privado solo nombre de la persona, sin GRUPO SECRETO encima */}
      <header className="top">
        {tab==='privado' ? <>
          <button className="icon" onClick={()=>setShowList(true)}>←</button>
          <div className="avatar">{privateUser.name[0]}</div>
          <div className="top-info"><b>{privateUser.name}</b><span>{privateUser.last} · privado</span></div>
          <button className="pill" onClick={()=>setShowList(true)}>Lista</button>
          <button className="icon" onClick={()=>setShowMenu(!showMenu)}>⋮</button>
        </> : <>
          <div className="avatar">S</div>
          <div className="top-info"><b>GRUPO SECRETO {isAdmin && <span className="admin-badge">ADMIN</span>}</b><span>● En línea · 1 en línea</span></div>
          <button className="icon" onClick={()=>{ setShowBubble(true); setBubbleMin(false) }}>◉</button>
          <button className="icon" onClick={()=>setShowMenu(!showMenu)}>⋮</button>
        </>}
      </header>

      {showMenu && <div className="menu">
        <button onClick={()=>{setShowMenu(false); setShowBubble(true); setBubbleMin(false)}}>◉ Burbuja — chat flotante</button>
        <button onClick={()=>{setShowMenu(false); setShowAdmin(true)}}>Panel Admin</button>
        <button onClick={()=>setShowMenu(false)}>Cerrar</button>
      </div>}

      <div className="messages" ref={listRef}>
        {currentMsgs.map(m => (
          <div key={m.id} className={`bubble ${m.own?'own':'other'}`}>
            {!m.own && <div className="from">{m.from}</div>}
            <div>{m.type==='audio' && m.audioUrl ? <audio controls src={m.audioUrl}/> : m.text}</div>
            <div className="meta">{m.time} {m.own && <span className="ticks">✓✓</span>}</div>
          </div>
        ))}
        {typingUser && <div className="typing">{typingUser} está escribiendo...</div>}
      </div>

      {/* INPUT FINO 60px */}
      <div className="input-bar">
        <label className="icon-btn">+<input type="file" accept="image/*" hidden onChange={pickPhoto} /></label>
        <label className="icon-btn">🖼️<input type="file" accept="image/*" hidden onChange={pickPhoto} /></label>
        <button className="icon-btn" onClick={()=>setShowEmoji(!showEmoji)}>😊</button>
        <textarea value={draft} onChange={e=>{ setDrafts(d=>({...d,[currentKey]:e.target.value})); setTypingUser(name||'Tú') }} placeholder={tab==='grupo'?'Escribe algo duro...':`Escribe a ${privateUser.name}...`} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendText() } }} />
        <button className={`mic ${isRecording?'rec':''}`} onTouchStart={startRec} onTouchEnd={stopRec} onMouseDown={startRec} onMouseUp={stopRec} onContextMenu={e=>{e.preventDefault(); e.stopPropagation()}}>🎤</button>
        <button className="send" onClick={sendText}>➤</button>
      </div>

      {showEmoji && <div className="emoji-panel">
        <div className="emoji-head"><b>Emojis · Stickers</b><button onClick={()=>setShowEmoji(false)}>✕</button></div>
        <div className="emoji-grid">{['🔥','💀','👑','💯','😂','❤️','😈','🙏','😎','🤣','👀','⚡'].map(e=><button key={e} onClick={()=>{ setDrafts(d=>({...d,[currentKey]:(d[currentKey]||'')+e})); setShowEmoji(false) }}>{e}</button>)}</div>
      </div>}

      {/* BARRA VERTICAL DERECHA */}
      <div className="side">
        <button onClick={()=>setTab('privado')}>P<br/>R<br/>I<br/>V<br/>A<br/>D<br/>O</button>
        <button className="side-grupo" onClick={()=>setTab('grupo')}>G<br/>R<br/>U<br/>P<br/>O</button>
        <button onClick={()=>setShowAdmin(true)}>A<br/>D<br/>M<br/>I<br/>N</button>
      </div>

      {/* LISTA DE USUARIOS */}
      {showList && <div className="sheet">
        <div className="sheet-head"><b>Chats / Usuarios</b><button onClick={()=>setShowList(false)}>✕</button></div>
        {USERS.map(u=><button key={u.id} className="user-row" onClick={()=>{ setPrivateUser(u); setTab('privado'); setShowList(false); setDrafts(d=>({...d,[u.id]:d[u.id]||''})) }}>{u.name} — {u.last}</button>)}
      </div>}

      {/* PANEL ADMIN */}
      {showAdmin && <div className="admin">
        <div className="admin-head"><b>Panel Admin</b><button onClick={()=>setShowAdmin(false)}>✕ CERRAR</button></div>
        <p>Generar llaves (solo el admin las ve):</p>
        <button className="btn-red" onClick={()=>{ const k='GRUPO-'+Math.random().toString(36).slice(2,8).toUpperCase(); setGeneratedKeys(p=>[k,...p]) }}>Generar nueva llave</button>
        {generatedKeys.map(k=><div key={k} className="key-row">{k}</div>)}
        <p>La llave de admin viene de la variable ADMIN_KEY en Abasthan, no está en el código.</p>
      </div>}

      {/* BURBUJA */}
      {bubbleMin && <button className="bubble-fab" onClick={()=>setBubbleMin(false)}>S</button>}
      {showBubble && !bubbleMin && <div className="bubble-window">
        <div className="bubble-top"><button onClick={()=>setBubbleMin(true)}>←</button><button className={tab==='grupo'?'active':''} onClick={()=>setTab('grupo')}>Grupo</button><button className={tab==='privado'?'active':''} onClick={()=>setTab('privado')}>Privado</button><button onClick={()=>setShowBubble(false)}>✕</button></div>
        <div className="bubble-msgs" ref={bubbleRef}>{currentMsgs.map(m=><div key={m.id} className={`bubble ${m.own?'own':'other'}`}><div>{m.text}</div><div className="meta">{m.time}</div></div>)}</div>
        <div className="bubble-input"><input value={draft} onChange={e=>setDrafts(d=>({...d,[currentKey]:e.target.value}))} placeholder="Escribe..." /><button onClick={sendText}>➤</button></div>
        <small>En la app final la burbuja flota sobre otras pantallas con permiso.</small>
      </div>}
    </div>
  )
    }
