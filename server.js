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
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Grupo Secreto en ' + PORT))
