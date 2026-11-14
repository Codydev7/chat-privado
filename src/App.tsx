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
        if(tab==='grupo')
