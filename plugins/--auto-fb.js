import { fbdown } from 'btch-downloader'

const facebookRegex =
  /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.watch|fb\.com)\/\S+/i

export async function before(m, { conn }) {
  if (!m.text) return

  const match = m.text.match(facebookRegex)
  if (!match) return

  const url = match[0]

  try {
    await m.react('⏳')

    const res = await fbdown(url)

    const { HD, Normal_video } = res

    if (HD) {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: HD },
          caption: '🌟 *فيديو Facebook HD تم تحميله تلقائياً*'
        },
        { quoted: m }
      )
    } else if (Normal_video) {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: Normal_video },
          caption: '🎥 *فيديو Facebook تم تحميله تلقائياً*'
        },
        { quoted: m }
      )
    }

    await m.react('✅')
  } catch (e) {
    console.error(e)
  }
}