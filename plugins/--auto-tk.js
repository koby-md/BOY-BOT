import { ttdl } from 'btch-downloader';

const handler = async (m, { conn }) => {
    const messageText = m.text.trim(); // استخدام m.text للحصول على محتوى الرسالة
m.reply(wait);
    // التأكد من أن الرابط موجود
    if (!messageText) {
        return conn.reply(m.chat, 'يرجى إرسال رابط TikTok لتحميله.', m);
    }

    // استدعاء API لتحميل الفيديو من TikTok
    try {
        let res = await ttdl(messageText);
        const { title, title_audio, thumbnail, video, audio, creator } = res;

        // إرسال الفيديو
        await conn.sendMessage(m.chat, {
            video: { url: video[0] },
            caption: `🎥 *فيديو TikTok تم تحميله!*`
        });

        // إرسال الصوت
        await conn.sendMessage(m.chat, {
            audio: { url: audio[0] },
            mimetype: 'audio/mp4',
            ptt: true,
            caption: `🎵 *تم تحميل الصوت:* ${title_audio}`
        });
    } catch (error) {
        console.error(error);
        conn.reply(m.chat, 'حدث خطأ أثناء معالجة الرابط.', m);
    }
};

// استخدام RegExp في customPrefix للتحقق من جميع روابط TikTok
handler.customPrefix = /https:\/\/(www\.)?(vt\.|m\.|www\.)?tiktok\.com\/[^\s]+/;  // تحقق من جميع روابط TikTok
handler.command = new RegExp(); // بدون أمر محدد

export default handler;
