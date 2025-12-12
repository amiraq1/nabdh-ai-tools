# دليل المساهمة / Contributing Guide

شكراً لاهتمامك بالمساهمة في مشروع نبض! 
Thank you for your interest in contributing to the Nabdh project!

## كيفية المساهمة / How to Contribute

### 1. الإبلاغ عن الأخطاء / Reporting Bugs

إذا وجدت خطأ، يرجى فتح issue جديد باستخدام قالب Bug Report.
If you find a bug, please open a new issue using the Bug Report template.

### 2. اقتراح ميزات جديدة / Suggesting Features

إذا كان لديك فكرة لميزة جديدة، يرجى فتح issue باستخدام قالب Feature Request.
If you have an idea for a new feature, please open an issue using the Feature Request template.

### 3. إرسال Pull Request / Submitting a Pull Request

1. **Fork المستودع / Fork the repository**
   ```bash
   git clone https://github.com/amiraq1/nabdh-ai-tools.git
   cd nabdh-ai-tools
   ```

2. **إعداد Node.js / Setup Node.js**
   - المشروع يتطلب Node.js 20 أو أحدث / Project requires Node.js 20 or newer
   - استخدم `.nvmrc` للتبديل التلقائي / Use `.nvmrc` for automatic switching:
   ```bash
   nvm use    # if using nvm
   ```
   - البيئة الموصى بها للتطوير: Node.js 20 / Recommended development environment: Node.js 20

3. **إنشاء فرع جديد / Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **تثبيت التبعيات / Install dependencies**
   ```bash
   pnpm install
   ```

4. **إجراء التغييرات / Make your changes**
   - اتبع نمط الكود الموجود / Follow the existing code style
   - أضف اختبارات إذا كان ذلك ممكناً / Add tests if applicable
   - قم بتحديث التوثيق إذا لزم الأمر / Update documentation if necessary

5. **اختبار التغييرات / Test your changes**
   ```bash
   pnpm run check    # فحص TypeScript / TypeScript check
   pnpm run build    # بناء المشروع / Build the project
   pnpm run dev      # اختبار محلي / Local testing
   ```

6. **Commit التغييرات / Commit your changes**
   ```bash
   git add .
   git commit -m "وصف مختصر للتغييرات / Brief description of changes"
   ```

7. **Push إلى GitHub / Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **إنشاء Pull Request / Create a Pull Request**
   - اذهب إلى المستودع على GitHub
   - انقر على "New Pull Request"
   - اتبع قالب Pull Request

## معايير الكود / Code Standards

### TypeScript
- استخدم TypeScript لجميع الملفات الجديدة / Use TypeScript for all new files
- تأكد من عدم وجود أخطاء في `pnpm run check` / Ensure no errors in `pnpm run check`

### React Components
- استخدم functional components مع hooks / Use functional components with hooks
- اتبع نمط المكونات الموجودة / Follow existing component patterns

### Styling
- استخدم TailwindCSS للتصميم / Use TailwindCSS for styling
- اتبع نظام التصميم المحدد / Follow the established design system

### Git Commit Messages
- استخدم رسائل commit واضحة ووصفية / Use clear and descriptive commit messages
- ابدأ برسالة بصيغة الأمر / Start with an imperative mood verb
- مثال / Example: "Add user authentication" أو "إضافة مصادقة المستخدم"

## بنية المشروع / Project Structure

```
nabdh-ai-tools/
├── client/              # الواجهة الأمامية / Frontend
│   ├── src/
│   │   ├── components/  # مكونات React / React components
│   │   ├── lib/         # مكتبات مساعدة / Utility libraries
│   │   └── pages/       # صفحات التطبيق / Application pages
│   └── public/
├── server/              # الواجهة الخلفية / Backend
│   ├── index.ts         # نقطة الدخول / Entry point
│   ├── routes.ts        # مسارات API / API routes
│   ├── auth.ts          # نظام المصادقة / Authentication
│   └── storage.ts       # تفاعلات قاعدة البيانات / Database interactions
├── shared/              # كود مشترك / Shared code
│   └── schema.ts        # مخطط قاعدة البيانات / Database schema
└── docs/                # التوثيق / Documentation
```

## الاختبار المحلي / Local Testing

1. **إعداد قاعدة البيانات / Setup Database**
   ```bash
   cp .env.example .env
   # قم بتحرير .env بالقيم المناسبة
   # Edit .env with appropriate values
   pnpm run db:push
   ```

2. **تشغيل خادم التطوير / Run Development Server**
   ```bash
   pnpm run dev
   ```

3. **الوصول إلى التطبيق / Access the Application**
   افتح المتصفح على `http://localhost:5000`
   Open browser at `http://localhost:5000`

## الحصول على المساعدة / Getting Help

إذا كنت بحاجة إلى مساعدة:
If you need help:

- افتح issue جديد / Open a new issue
- اطرح سؤالاً في Discussions / Ask a question in Discussions
- تواصل مع المشرفين / Contact the maintainers

## رخصة المساهمة / Contribution License

بالمساهمة في هذا المشروع، فإنك توافق على أن مساهماتك ستكون مرخصة بموجب رخصة MIT الخاصة به.
By contributing to this project, you agree that your contributions will be licensed under its MIT License.

---

شكراً لمساهمتك! 🎉
Thank you for your contribution! 🎉
