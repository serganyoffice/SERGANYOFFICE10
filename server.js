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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is missing.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','confirmed','cancelled')),
      total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      paid NUMERIC(12,2) NOT NULL DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : '';

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'غير مصرح' });
  }
}

// فحص السيرفر وقاعدة البيانات
app.get('/api/health', async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({
        ok: true,
        database: false,
        message: 'DATABASE_URL is missing'
      });
    }

    await pool.query('SELECT 1');

    res.json({
      ok: true,
      database: true
    });
  } catch (error) {
    console.error(error);

    res.status(503).json({
      ok: false,
      database: false
    });
  }
});

// تسجيل دخول الأدمن
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: 'اسم المستخدم وكلمة المرور مطلوبان'
      });
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    const token = jwt.sign(
      {
        sub: username,
        role: 'admin'
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ في تسجيل الدخول'
    });
  }
});

// جلب الحجوزات
app.get('/api/requests', auth, async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    const { rows } = await pool.query(`
      SELECT
        id,
        created_at AS "createdAt",
        name,
        phone,
        service,
        details,
        status,
        total_price AS "totalPrice",
        paid
      FROM requests
      ORDER BY created_at DESC
    `);

    res.json(
      rows.map((x) => ({
        ...x,
        totalPrice: Number(x.totalPrice),
        paid: Number(x.paid),
        date: new Date(x.createdAt).toLocaleString('ar-EG')
      }))
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ في جلب الحجوزات'
    });
  }
});

// إضافة حجز
app.post('/api/requests', async (req, res) => {
  try {
    const { name, phone, service, details } = req.body || {};

    if (!name || !phone || !service || !details) {
      return res.status(400).json({
        error: 'كل البيانات مطلوبة'
      });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO requests(name, phone, service, details)
      VALUES($1, $2, $3, $4)
      RETURNING
        id,
        created_at AS "createdAt",
        name,
        phone,
        service,
        details,
        status,
        total_price AS "totalPrice",
        paid
      `,
      [
        String(name).trim(),
        String(phone).trim(),
        String(service).trim(),
        String(details).trim()
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ أثناء إنشاء الحجز'
    });
  }
});

// تعديل حجز
app.put('/api/requests/:id', auth, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    const {
      name,
      phone,
      service,
      details,
      status,
      totalPrice,
      paid
    } = req.body || {};

    if (!name || !phone || !service || !details || !status) {
      return res.status(400).json({
        error: 'كل البيانات مطلوبة'
      });
    }

    const { rows } = await pool.query(
      `
      UPDATE requests
      SET
        name = $1,
        phone = $2,
        service = $3,
        details = $4,
        status = $5,
        total_price = $6,
        paid = $7
      WHERE id = $8
      RETURNING
        id,
        created_at AS "createdAt",
        name,
        phone,
        service,
        details,
        status,
        total_price AS "totalPrice",
        paid
      `,
      [
        String(name).trim(),
        String(phone).trim(),
        String(service).trim(),
        String(details).trim(),
        status,
        Math.max(0, Number(totalPrice) || 0),
        Math.max(0, Number(paid) || 0),
        req.params.id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'الحجز غير موجود'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ أثناء تعديل الحجز'
    });
  }
});

// حذف حجز
app.delete('/api/requests/:id', auth, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    const result = await pool.query(
      'DELETE FROM requests WHERE id = $1',
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        error: 'الحجز غير موجود'
      });
    }

    res.status(204).end();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ أثناء حذف الحجز'
    });
  }
});

// حذف جميع الحجوزات
app.delete('/api/requests', auth, async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    await pool.query('DELETE FROM requests');

    res.status(204).end();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ أثناء حذف الحجوزات'
    });
  }
});

// جلب حالة التوفر
app.get('/api/settings/availability', auth, async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    const { rows } = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['availability']
    );

    res.json({
      value: rows[0]?.value || ''
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ'
    });
  }
});

// تعديل حالة التوفر
app.put('/api/settings/availability', auth, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'قاعدة البيانات غير متصلة'
      });
    }

    const value = String(req.body?.value || '').trim();

    await pool.query(
      `
      INSERT INTO settings(key, value)
      VALUES('availability', $1)
      ON CONFLICT(key)
      DO UPDATE SET value = EXCLUDED.value
      `,
      [value]
    );

    res.json({ value });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'حدث خطأ أثناء حفظ الإعداد'
    });
  }
});

// صفحة لوحة التحكم
app.get('/admin-panel.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

// تشغيل السيرفر أولاً
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sergany backend running on port ${PORT}`);

  // تشغيل قاعدة البيانات بعد فتح الـ Port
  initDb()
    .then(() => {
      console.log('Database initialized successfully');
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
    });
});
