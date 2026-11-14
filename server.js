import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())
const ADMIN_KEY = process.env.ADMIN_KEY || ''
let keys = []
let messages = { grupo: [] }

app.post('/api/login', (req, res) => {
  const { name, key } = req.body || {}
  const clean = String(key || '').trim().toUpperCase()
  if (!name || !clean) return res.status(400).json({ ok: false, error: 'Falta nombre o llave' })
  if (ADMIN_KEY && clean === ADMIN_KEY.trim().toUpperCase()) return res.json({ ok: true, isAdmin: true, name })
  const found = keys.find(k => k.active && k.key.toUpperCase() === clean)
  if (found) return res.json({ ok: true, isAdmin: false, name })
  return res.status(401).json({ ok: false, error: 'Llave incorrecta' })
})

function isAdminReq(req){ return ADMIN_KEY && req.headers['x-admin-key'] === ADMIN_KEY }
app.post('/api/admin/keys', (req, res) => {
  if (!isAdminReq(req)) return res.status(403).json({ ok: false })
  const key = 'GRUPO-' + Math.random().toString(36).slice(2,8).toUpperCase()
  const item = { id: Date.now().toString(), key, active: true, createdAt: Date.now() }
  keys.push(item); return res.json({ ok: true, key: item })
})
app.get('/api/admin/keys', (req, res) => { if(!isAdminReq(req)) return res.status(403).json({ok:false}); return res.json({ok:true, keys}) })
app.post('/api/admin/keys/:id/close', (req, res) => { if(!isAdminReq(req)) return res.status(403).json({ok:false}); const k = keys.find(x=>x.id===req.params.id); if(k) k.active=false; return res.json({ok:true}) })
app.get('/api/messages', (req, res) => res.json({ ok: true, messages: messages.grupo }))
app.post('/api/messages', (req, res) => { const m = { ...req.body, id: Date.now().toString(), createdAt: Date.now() }; messages.grupo.push(m); return res.json({ ok: true, message: m }) })

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Grupo Secreto en ' + PORT))
