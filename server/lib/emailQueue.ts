import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function enqueueEmail(to:string,template:string,payload:Record<string,unknown>){ return prisma.emailJob.create({data:{to,template,payload:payload as any}}); }
export function render(t:string,p:Record<string,unknown>){ return t.replace(/{{\s*([\w.]+)\s*}}/g,(_,k)=>esc(String(k.split('.').reduce((a:any,x:string)=>a?.[x],p)??''))); }
export async function processEmailQueue(){
  const staleBefore=new Date(Date.now()-10*60*1000);
  await prisma.emailJob.updateMany({where:{status:'processing',updatedAt:{lt:staleBefore},attempts:{lt:5}},data:{status:'pending',scheduledAt:new Date()}});
  const jobs=await prisma.emailJob.findMany({where:{status:'pending',scheduledAt:{lte:new Date()}},orderBy:{createdAt:'asc'},take:10});
  for(const job of jobs){
    const claimed=await prisma.emailJob.updateMany({where:{id:job.id,status:'pending'},data:{status:'processing',attempts:{increment:1}}});
    if(!claimed.count) continue;
    try{
      const tpl=await prisma.emailTemplate.findUnique({where:{key:job.template}});
      if(!tpl || !tpl.enabled) throw new Error('Email template unavailable');
      const subject=render(tpl.subject,job.payload as any), html=render(tpl.html,job.payload as any), text=render(tpl.text,job.payload as any);
      const key=process.env.RESEND_API_KEY; const from=process.env.EMAIL_FROM;
      if(!key || !from) throw new Error('RESEND_API_KEY and EMAIL_FROM are required for email delivery');
      const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:job.to,subject,html,text})});
      if(!r.ok) throw new Error(`Email provider returned ${r.status}`);
      const body=await r.json() as any;
      await prisma.emailJob.update({where:{id:job.id},data:{status:'sent',sentAt:new Date(),providerId:body.id??null,lastError:null}});
    }catch(e){
      const msg=e instanceof Error?e.message:'Email delivery failed';
      const current=await prisma.emailJob.findUnique({where:{id:job.id},select:{attempts:true,maxAttempts:true}});
      const dead=!!current && current.attempts>=current.maxAttempts;
      await prisma.emailJob.update({where:{id:job.id},data:{status:dead?'dead_letter':'pending',failedAt:new Date(),lastError:msg,scheduledAt:dead?new Date():new Date(Date.now()+Math.min(3600000,Math.pow(2,current?.attempts??1)*30000))}});
    }
  }
}
