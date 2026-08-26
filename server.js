const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-now';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false });

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

async function initDb(){
  if(!process.env.DATABASE_URL){
    console.warn('DATABASE_URL is missing. Set it in Render.');
    return;
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS requests (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
    total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid NUMERIC(12,2) NOT NULL DEFAULT 0
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
}

function auth(req,res,next){
  const h=req.headers.authorization||'';
  const token=h.startsWith('Bearer ')?h.slice(7):'';
  try{ req.admin=jwt.verify(token,JWT_SECRET); next(); }
  catch{ res.status(401).json({error:'غير مصرح'}); }
}

app.get('/api/health', async (_req,res)=>{
  try{ await pool.query('SELECT 1'); res.json({ok:true, database:true}); }
  catch{ res.status(503).json({ok:false,database:false}); }
});

app.post('/api/auth/login', async (req,res)=>{
  const {username,password}=req.body||{};
  if(username!==ADMIN_USER || !password || !bcrypt.compareSync(password,bcrypt.hashSync(ADMIN_PASSWORD,10)))
    return res.status(401).json({error:'اسم المستخدم أو كلمة المرور غير صحيحة'});
  const token=jwt.sign({sub:username,role:'admin'},JWT_SECRET,{expiresIn:'8h'});
  res.json({token});
});

app.get('/api/requests', auth, async (_req,res)=>{
  const {rows}=await pool.query(`SELECT id, created_at AS "createdAt", name, phone, service, details, status, total_price AS "totalPrice", paid FROM requests ORDER BY created_at DESC`);
  res.json(rows.map(x=>({...x,totalPrice:Number(x.totalPrice),paid:Number(x.paid),date:new Date(x.createdAt).toLocaleString('ar-EG')})));
});

app.post('/api/requests', async (req,res)=>{
  const {name,phone,service,details}=req.body||{};
  if(!name||!phone||!service||!details) return res.status(400).json({error:'كل البيانات مطلوبة'});
  const {rows}=await pool.query(`INSERT INTO requests(name,phone,service,details) VALUES($1,$2,$3,$4) RETURNING id,created_at AS "createdAt",name,phone,service,details,status,total_price AS "totalPrice",paid`,[name.trim(),phone.trim(),service.trim(),details.trim()]);
  res.status(201).json(rows[0]);
});

app.put('/api/requests/:id', auth, async (req,res)=>{
  const {name,phone,service,details,status,totalPrice,paid}=req.body||{};
  const {rows}=await pool.query(`UPDATE requests SET name=$1,phone=$2,service=$3,details=$4,status=$5,total_price=$6,paid=$7 WHERE id=$8 RETURNING id,created_at AS "createdAt",name,phone,service,details,status,total_price AS "totalPrice",paid`,[name?.trim(),phone?.trim(),service?.trim(),details?.trim(),status,Math.max(0,Number(totalPrice)||0),Math.max(0,Number(paid)||0),req.params.id]);
  if(!rows[0]) return res.status(404).json({error:'الحجز غير موجود'}); res.json(rows[0]);
});

app.delete('/api/requests/:id', auth, async (req,res)=>{
  const r=await pool.query('DELETE FROM requests WHERE id=$1',[req.params.id]);
  if(!r.rowCount) return res.status(404).json({error:'الحجز غير موجود'}); res.status(204).end();
});

app.delete('/api/requests', auth, async (_req,res)=>{ await pool.query('DELETE FROM requests'); res.status(204).end(); });

app.get('/api/settings/availability', auth, async (_req,res)=>{
  const {rows}=await pool.query('SELECT value FROM settings WHERE key=$1',['availability']);
  res.json({value:rows[0]?.value||''});
});
app.put('/api/settings/availability', auth, async (req,res)=>{
  const value=String(req.body?.value||'').trim();
  await pool.query(`INSERT INTO settings(key,value) VALUES('availability',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`,[value]);
  res.json({value});
});

app.get('/admin-panel.html', (_req,res)=>res.sendFile(path.join(__dirname,'admin-panel.html')));

initDb().then(()=>app.listen(PORT,()=>console.log(`Sergany backend running on ${PORT}`))).catch(err=>{console.error(err);process.exit(1)});
