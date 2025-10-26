import fs from 'fs';
import { igdl } from 'btch-downloader';

const handler = async (m, { conn }) => {
    const instagramUrlPattern = /^(https?:\/\/)?(www\.)?(instagram\.com|ig\.me)\/.+$/;
    const messageText = m.text.trim();

    if (!instagramUrlPattern.test(messageText)) {
        return; // إذا لم يكن الرابط من Instagram، لا تفعل شيئًا
    }

    m.reply(wait);

    try {
        let res = await igdl(messageText);

        for (let i of res) {
            const videoPath = `./src/tmp/instagram_${Date.now()}.mp4`;

            // تنزيل الفيديو
            let buffer = await (await fetch(i.url)).buffer();
            fs.writeFileSync(videoPath, buffer);

            // إرسال الفيديو للمستخدم
            await conn.sendFile(m.chat, videoPath, 'instagram.mp4', '*_✅ تم التنزيل!_*', m);

            // حذف الفيديو المؤقت بعد الإرسال
            fs.unlinkSync(videoPath);
        }
    } catch (error) {
        console.error("❌ خطأ أثناء تنزيل فيديو Instagram:", error);
        m.reply('⚠️ حدث خطأ أثناء التنزيل. حاول مرة أخرى لاحقًا.');
    }
};

// تشغيل البوت تلقائيًا عند إرسال رابط Instagram
handler.customPrefix = /^(https?:\/\/)?(www\.)?(instagram\.com|ig\.me)\/.+$/;
handler.command = new RegExp(); // بدون أمر محدد

export default handler;