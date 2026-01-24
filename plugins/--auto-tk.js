import axios from 'axios';
import cheerio from 'cheerio';

// --- Scraper Logic for TikTok ---
const SITE_URL = 'https://instatiktok.com/';

async function tiktokDownloader(inputUrl) {
  if (!inputUrl) throw new Error('يرجى تقديم رابط صالح.');

  const form = new URLSearchParams();
  form.append('url', inputUrl);
  form.append('platform', 'tiktok');
  form.append('siteurl', SITE_URL);

  const { data } = await axios.post(`${SITE_URL}api`, form.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': SITE_URL,
      'Referer': SITE_URL,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (data.status !== 'success' || !data.html) {
    throw new Error('فشل في جلب بيانات TikTok');
  }

  const $ = cheerio.load(data.html);
  const links = [];

  $('a.btn[href^="http"]').each((_, el) => {
    const link = $(el).attr('href');
    if (link && !links.includes(link)) links.push(link);
  });

  if (!links.length) throw new Error('لم يتم العثور على رابط تحميل');

  // الأفضل بدون علامة مائية
  const downloadUrl =
    links.find(l => /hdplay|nowm/i.test(l)) || links[0];

  return downloadUrl;
}

// --- AUTO HANDLER ---
const handler = async (m, { conn }) => {
  const text =
    m.text ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text;

  if (!text) return;

  const tiktokRegex =
    /^(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com)\/.+$/;

  if (!tiktokRegex.test(text)) return;

  try {
    await m.reply(wait);

    const videoUrl = await tiktokDownloader(text);

    await conn.sendFile(
      m.chat,
      videoUrl,
      'tiktok.mp4',
      '✅ تم تنزيل الفيديو',
      m
    );

  } catch (e) {
    console.error(e);
    m.reply('❌ فشل تنزيل فيديو TikTok');
  }
};

// 👇 بدون أمر – تفاعل تلقائي
handler.customPrefix =
  /^(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com)\/.+$/;
handler.command = new RegExp();

export default handler;