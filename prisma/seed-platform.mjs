import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
const templates=[
 {key:'admin_test',name:'Admin test email',subject:'OmniServe email delivery test',html:'<h2>OmniServe</h2><p>Hello {{name}}, your email delivery configuration is working.</p>',text:'OmniServe\nHello {{name}}, your email delivery configuration is working.'},
 {key:'provider_welcome',name:'Provider welcome',subject:'Welcome to OmniServe, {{name}}',html:'<h2>Welcome {{name}}</h2><p>Your provider workspace is ready. Complete verification to appear to customers.</p>',text:'Welcome {{name}}. Your provider workspace is ready.'},
 {key:'security_alert',name:'Security alert',subject:'Security alert for your OmniServe account',html:'<h2>Security alert</h2><p>{{message}}</p>',text:'Security alert\n{{message}}'}
];
for(const t of templates) await prisma.emailTemplate.upsert({where:{key:t.key},create:t,update:{name:t.name,subject:t.subject,html:t.html,text:t.text,enabled:true}});
await prisma.$disconnect();
