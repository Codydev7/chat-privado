import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
app.use(express.json())
const ADMIN_KEY = process.env.ADMIN_KEY || 'GRUPO-DURO-1'
const keys = new Set([ADMIN_KEY])
app.post('/api/login', (req,res)=>{
  const { name, key } = req.body || {}
  if(!name || !key) return res.json({ ok:false })
  if(keys.has(key) || key===ADMIN_KEY) return res.json({ ok:true, isAdmin: key===ADMIN_KEY })
  return res.json({ ok:false })
})
app.post('/api/admin/keys', (req,res)=>{
  if(req.headers['x-admin-key']!==ADMIN_KEY) return res.json({ ok:false })
  const k='GRUPO-'+Math.random().toString(36).slice(2,8).toUpperCase()
  keys.add(k); return res.json({ ok:true, key:{ key:k } })
})
app.use(express.static(path.join(__dirname,'dist')))
app.get('*', (req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')))
app.listen(3000, ()=>console.log('Grupo Secreto en 3000'))
