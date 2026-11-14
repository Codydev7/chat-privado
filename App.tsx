import React, { useState } from 'react';

export default function App() {
  const [nombre, setNombre] = useState('');
  const [llave, setLlave] = useState('');
  const [entrado, setEntrado] = useState(false);
  const [msg, setMsg] = useState('');
  const [mensajes, setMensajes] = useState<string[]>([]);

  if (!entrado) {
    return (
      <div style={{minHeight:'100dvh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'system-ui'}}>
        <div style={{width:'100%',maxWidth:380,background:'#0a0a0a',border:'2px solid #ff0000',borderRadius:20,padding:32,textAlign:'center',boxShadow:'0 0 40px rgba(255,0,0,.3)'}}>
          <div style={{fontSize:28,fontWeight:900,color:'#ff0000',letterSpacing:2,marginBottom:8}}>GRUPO SECRETO</div>
          <div style={{color:'#999',fontSize:13,marginBottom:20}}>Solo los del grupo entran</div>
          <input placeholder="Pon cualquier nombre" value={nombre} onChange={e=>setNombre(e.target.value)} style={{width:'100%',padding:14,background:'#1a1a1a',border:'1px solid #333',borderRadius:12,color:'#fff',marginBottom:12,fontSize:15,boxSizing:'border-box'}} />
          <input placeholder="Tu llave de acceso" type="password" value={llave} onChange={e=>setLlave(e.target.value)} style={{width:'100%',padding:14,background:'#1a1a1a',border:'1px solid #333',borderRadius:12,color:'#fff',marginBottom:12,fontSize:15,boxSizing:'border-box'}} />
          <button onClick={()=>{if(nombre && llave) setEntrado(true)}} style={{width:'100%',padding:14,background:'#ff0000',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer'}}>Entrar al grupo →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100dvh',background:'#000',color:'#fff',fontFamily:'system-ui',display:'flex',flexDirection:'column'}}>
      <div style={{padding:14,borderBottom:'2px solid #ff0000',fontWeight:900,color:'#ff0000',textAlign:'center'}}>GRUPO SECRETO - {nombre}</div>
      <div style={{flex:1,padding:16,overflowY:'auto'}}>
        {mensajes.length===0 && <div style={{color:'#888',textAlign:'center',marginTop:40}}>Bienvenido {nombre}, escribe algo</div>}
        {mensajes.map((m,i)=>(<div key={i} style={{background:'#1a1a1a',padding:10,borderRadius:12,marginBottom:8}}><b style={{color:'#ff0000'}}>{nombre}: </b>{m}</div>))}
      </div>
      <div style={{display:'flex',gap:8,padding:12,borderTop:'1px solid #222'}}>
        <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Escribe..." style={{flex:1,padding:12,background:'#1a1a1a',border:'1px solid #333',borderRadius:12,color:'#fff'}} />
        <button onClick={()=>{if(msg){setMensajes([...mensajes,msg]);setMsg('')}}} style={{padding:'12px 16px',background:'#ff0000',color:'#fff',border:'none',borderRadius:12,fontWeight:800}}>Enviar</button>
      </div>
    </div>
  );
}
