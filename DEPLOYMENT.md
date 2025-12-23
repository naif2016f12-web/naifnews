# دليل نشر موقع NaifNews (Deployment Guide)

لقد تم تحويل مشروعك الآن ليصبح تطبيق **Node.js** متكامل. هذا يعني أنه جاهز للاستضافة على منصات سحابية حقيقية تدعم الواجهة الخلفية وقواعد البيانات.

## المتطلبات المسبقة (محلياً)
لتشغيل الخادم الجديد على جهازك:
1. تأكد من تثبيت Node.js.
2. افتح الموجه (Terminal) في مجلد المشروع واكتب الأمر التالي لتثبيت المكتبات:
   ```bash
   npm install
   ```
3. شغل الخادم بالأمر:
   ```bash
   npm start
   ```
4. سيصبح الرابط `http://localhost:3000`.

---

## خيارات الاستضافة (Hosting Options)

### الخيار 1: Vercel (الأسهل والأسرع)
Vercel يدعم تحويل تطبيقات Express إلى Serverless functions تلقائياً.
1. أنشئ حساباً على [Vercel.com](https://vercel.com).
2. حمل أداة Vercel CLI أو اربط حسابك بـ GitHub.
3. أنشئ ملفاً جديداً في المجلد الرئيسي باسم `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```
4. ارفع المشروع.

### الخيار 2: Render.com (خادم ويب كامل)
هذا الخيار أفضل إذا كنت تريد استخدام قاعدة بيانات متصلة وتخزين ملفات.
1. أنشئ حساباً على [Render.com](https://render.com).
2. اختر **New Web Service**.
3. اربط مستودع GitHub الخاص بك.
4. في إعدادات التشغيل:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. سيعطيك Render رابطاً مجانياً `https://naifnews.onrender.com`.

---

## قاعدة البيانات (Database)
حالياً، يقوم الخادم بحفظ البيانات في ملف `server_db.json`. للانتقال للإنتاج:
1. أنشئ قاعدة بيانات مجانية على **MongoDB Atlas**.
2. احصل على رابط الاتصال (Connection String).
3. في ملف `server.js`، استبدل دوال `getDB` للاتصال بـ Mongoose بدلاً من `fs`.

## تخزين الصور (Cloud Storage)
لتخزين الصور بدلاً من تحويلها لرموز Base64:
1. أنشئ حساب AWS S3 أو Firebase Storage.
2. استخدم مكتبة `multer-s3` في `server.js` لرفع الصور القادمة من النموذج مباشرة إلى السحابة والحصول على رابط الصورة (URL) لحفظه في قاعدة البيانات.

## الأمان (Security)
الكود الحالي يحتوي على:
- **Helmet:** لحماية ترويسات HTTP.
- **Cors:** لتحديد النطاقات المسموح لها بالاتصال.
- **Rate Limiting:** للحماية من هجمات الحرمان من الخدمة (DDos).
- **JWT:** لتأمين جلسات الدخول بدلاً من الاعتماد الكلي على المتصفح.

---
**ملاحظة:** لتفعيل هذا النظام الجديد بالكامل، يجب تعديل ملفات `script.js` و `admin_script.js` لاستبدال `localStorage.getItem` بـ `fetch('/api/articles')`.
