# 1. المرحلة الأساسية: استخدام صورة Node.js رسمية بإصدار 20
# نستخدم صورة 'slim' لتقليل حجم الصورة النهائية، وهي قائمة على Debian.
FROM node:20-slim

# 2. تثبيت التبعيات الإضافية للنظام: FFmpeg (لتشغيل الوسائط) و GIT (لحل خطأ npm install).
RUN apt-get update && \
    apt-get install -y ffmpeg git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. إعداد دليل العمل داخل الحاوية
WORKDIR /usr/src/app

# 4. نسخ ملفات تعريف المشروع أولاً (package.json و package-lock.json)
# هذا يسمح لـ Docker بالتخزين المؤقت لخطوة npm install ما لم تتغير هذه الملفات.
COPY package*.json ./

# 5. تثبيت اعتمادات Node.js
RUN npm install

# 6. نسخ باقي ملفات المشروع
COPY . .

# 7. المنفذ الذي يستمع إليه التطبيق (إذا كان تطبيق ويب - يمكن حذفه إذا لم يكن تطبيق ويب)
# EXPOSE 3000

# 8. الأمر الافتراضي لتشغيل التطبيق
CMD [ "npm", "run", "start" ]
