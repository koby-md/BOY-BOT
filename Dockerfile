# 1. المرحلة الأساسية: استخدام صورة Node.js رسمية بإصدار 20
# اختر نظام تشغيل خفيف مثل Alpine أو الأفضل Debian Slim (لضمان توافق أفضل مع FFmpeg)
FROM node:20-slim

# 2. تثبيت التبعيات الإضافية للنظام (مثل FFmpeg)
# تحديث قوائم الحزم وتثبيت FFmpeg وإزالة الملفات المؤقتة لتصغير حجم الصورة
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. إعداد دليل العمل داخل الحاوية
WORKDIR /usr/src/app

# 4. نسخ ملفات تعريف المشروع أولاً (لتسهيل التخزين المؤقت لـ Docker)
# نسخ package.json و package-lock.json
COPY package*.json ./

# 5. تثبيت اعتمادات Node.js
# هذه الخطوة تتوافق مع "Install Dependencies" في Workflow
RUN npm install

# 6. نسخ باقي ملفات المشروع إلى دليل العمل
# هذه الخطوة تتوافق مع "Clone repository" في Workflow
COPY . .

# 7. المنفذ الذي يستمع إليه التطبيق (إذا كان تطبيق ويب)
# هذا اختياري، يمكنك تغييره حسب منفذ تطبيقك
# EXPOSE 3000

# 8. الأمر الافتراضي لتشغيل التطبيق
# هذه الخطوة تتوافق مع "Start Project" في Workflow
CMD [ "npm", "run", "start" ]
