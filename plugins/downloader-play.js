import yts from 'yt-search';

let handler = async (m, { conn, usedPrefix, text }) => {
    if (!text) {
        return conn.reply(m.chat, 'Please provide the name of a YouTube video or channel.', m);
    }

    try {
        let result = await yts(text);
        let ytres = result.videos;

        if (!ytres || ytres.length === 0) {
            return conn.reply(m.chat, 'No results found.', m);
        }

        // أول نتيجة فقط
        let v = ytres[0];

        // 1️⃣ إرسال الصورة + العنوان + الرابط
        await conn.sendMessage(
            m.chat,
            {
                image: { url: v.thumbnail },
                caption: `*${v.title}*\n${v.url}`
            },
            { quoted: m }
        );

        // 2️⃣ إرسال الأزرار فقط
        let buttons = [
            {
                buttonId: `${usedPrefix}ytmp3 ${v.url}`,
                buttonText: { displayText: '🎧 Audio' },
                type: 1
            },
            {
                buttonId: `${usedPrefix}ytmp4 ${v.url}`,
                buttonText: { displayText: '🎬 Video' },
                type: 1
            }
        ];

        await conn.sendMessage(
            m.chat,
            {
                text: '*_📥 إختر بأي وسيلة يمكنني التنزيل_*',
                buttons,
                footer: 'YouTube',
                headerType: 1
            },
            { quoted: m }
        );

    } catch (e) {
        console.log(e);
        m.reply('Please try again.');
    }
};

handler.help = ['play'];
handler.tags = ['dl'];
handler.command = /^play|ytbuscar|yts(earch)?$/i;


export default handler;