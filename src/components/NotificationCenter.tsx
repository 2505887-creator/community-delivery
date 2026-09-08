import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Notification = { id:string; type:string; title:string; message:string; readAt:string|null; createdAt:string };

export default function NotificationCenter(){
  const {session}=useAuth();
  const [items,setItems]=useState<Notification[]>([]);
  const [open,setOpen]=useState(false);
  const headers=useMemo(()=>({Authorization:`Bearer ${session?.access_token}`}),[session?.access_token]);
  const load=async()=>{if(!session)return;const r=await fetch('/api/account/notifications',{headers});const j=await r.json().catch(()=>({}));if(r.ok&&Array.isArray(j.data))setItems(j.data)};
  useEffect(()=>{void load(); const t=window.setInterval(()=>{if(document.visibilityState==='visible')void load()},15000);return()=>window.clearInterval(t)},[session?.access_token]);
  const unread=items.filter(x=>!x.readAt).length;
  const markAll=async()=>{await fetch('/api/account/notifications/read-all',{method:'POST',headers});await load()};
  const mark=async(id:string)=>{await fetch(`/api/account/notifications/${id}/read`,{method:'POST',headers});setItems(x=>x.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n))};
  return <div className="notification-center"><button className="icon-button" aria-label={`Notifications${unread?`, ${unread} unread`:''}`} onClick={()=>setOpen(x=>!x)}><Bell size={19}/>{unread>0&&<span className="notification-badge">{unread>99?'99+':unread}</span>}</button>{open&&<div className="notification-popover"><header><div><strong>Notifications</strong><small>{unread?`${unread} unread`:'All caught up'}</small></div><div className="notification-actions">{unread>0&&<button onClick={markAll} aria-label="Mark all as read"><CheckCheck size={16}/></button>}<button onClick={()=>setOpen(false)} aria-label="Close notifications"><X size={16}/></button></div></header><div className="notification-list">{items.length===0?<p className="notification-empty">No notifications yet.</p>:items.slice(0,30).map(n=><button key={n.id} className={`notification-item ${n.readAt?'read':''}`} onClick={()=>void mark(n.id)}><span className="notification-dot"/><span><strong>{n.title}</strong><small>{n.message}</small><time>{new Date(n.createdAt).toLocaleString()}</time></span></button>)}</div></div>}</div>
}
