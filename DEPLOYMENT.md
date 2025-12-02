# دليل نشر nabdh-ai-tools على Railway

## المتطلبات الأساسية

1. حساب على [Railway](https://railway.app)
2. قاعدة بيانات PostgreSQL (يمكن إنشاؤها من Railway)
3. مستودع GitHub متصل

## خطوات النشر

### 1. إعداد قاعدة البيانات

في لوحة تحكم Railway:
- انقر على "New Project"
- اختر "Provision PostgreSQL"
- سيتم إنشاء قاعدة بيانات تلقائياً

### 2. ربط المستودع

- في نفس المشروع، انقر على "New Service"
- اختر "GitHub Repo"
- اختر مستودع `nabdh-ai-tools`
- Railway سيكتشف تلقائياً أنه مشروع Node.js

### 3. إعداد المتغيرات البيئية

في إعدادات الخدمة (Service Settings)، أضف المتغيرات التالية:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=<generate-random-string>
NODE_ENV=production
```

**متغيرات إضافية (إذا لزم الأمر):**
```
GOOGLE_CLIENT_ID=<your-value>
GOOGLE_CLIENT_SECRET=<your-value>
GOOGLE_REDIRECT_URI=<your-value>
OPENID_CLIENT_ID=<your-value>
OPENID_CLIENT_SECRET=<your-value>
```

### 4. تشغيل Migrations

بعد النشر الأول، قد تحتاج إلى تشغيل:
```bash
npm run db:push
```

يمكنك تشغيل هذا الأمر من خلال Railway CLI أو من خلال إضافة سكريبت post-build.

### 5. النشر

Railway سيقوم بالنشر تلقائياً عند:
- Push جديد إلى الفرع الرئيسي
- أو يمكنك النشر يدوياً من لوحة التحكم

## الأوامر المتاحة

- `npm run dev` - التطوير المحلي
- `npm run build` - بناء المشروع للإنتاج
- `npm start` - تشغيل المشروع في وضع الإنتاج
- `npm run db:push` - تطبيق تغييرات قاعدة البيانات

## ملاحظات مهمة

1. **المنفذ (Port):** Railway يحدد المنفذ تلقائياً عبر متغير `PORT`
2. **قاعدة البيانات:** تأكد من ربط متغير `DATABASE_URL` بقاعدة البيانات
3. **الأمان:** لا تضع أي أسرار في الكود، استخدم المتغيرات البيئية فقط
4. **الأداء:** المشروع يستخدم esbuild لتحسين أوقات البدء البارد

## استكشاف الأخطاء

- **فشل البناء:** تحقق من سجلات البناء (Build Logs)
- **فشل التشغيل:** تحقق من سجلات التطبيق (Deploy Logs)
- **مشاكل قاعدة البيانات:** تأكد من صحة `DATABASE_URL`

## الدعم

للمزيد من المعلومات، راجع:
- [Railway Documentation](https://docs.railway.app)
- [Railway Templates](https://railway.app/templates)
