مكتب محمد السرجاني — Premium Design + Backend

تم تحويل المشروع إلى Full-Stack جاهز للنشر على Render:
- Node.js + Express API
- PostgreSQL للحجوزات والإعدادات
- JWT لتسجيل دخول لوحة الإدارة
- الحجز يُحفظ في قاعدة البيانات ثم يفتح WhatsApp
- لوحة الإدارة تتعامل مع السيرفر بدل LocalStorage
- render.yaml جاهز لإنشاء Web Service + PostgreSQL

على Render اضبط:
ADMIN_USER = اسم مستخدم الأدمن
ADMIN_PASSWORD = كلمة مرور قوية
JWT_SECRET = يتم توليده تلقائيًا من render.yaml
DATABASE_URL = يتم ربطه تلقائيًا بقاعدة PostgreSQL
