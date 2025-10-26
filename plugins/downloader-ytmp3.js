import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('❌ يرجى إدخال رابط يوتيوب')

  try {
    const apiUrl = `https://ruby-core.vercel.app/api/download/youtube/mp3?url=${encodeURIComponent(text)}`
    const res = await fetch(apiUrl)
    const data = await res.json()

    if (!data.status) return m.reply('❌ فشل في الحصول على بيانات المقطع')

    const info = data.metadata
    const downloadUrl = data.download.url
    const thumbnailUrl = info.thumbnail
    const title = info.title

    


    // إرسال الصوت كمقطع عادي (audio/mpeg)
    await conn.sendMessage(m.chat, {
      audio: { url: downloadUrl },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    }, { quoted: m })

  } catch (error) {
    console.error(error)
    m.reply(`❌ حدث خطأ: ${error.message}`)
  }
}

handler.help = ['ytmp3 <url>']
handler.tags = ['downloader']
handler.command = /^(ytmp3|ytdlmp3)$/i
handler.limit = false 

export default handler