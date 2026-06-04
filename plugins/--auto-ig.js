import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {

  if (!args[0]) throw `✳️ Ingrese un Link de Instagram`
  m.react(rwait)

  // تحديد مسار مؤقت لحفظ الملف في السيرفر
  let filePath = path.join(process.cwd(), `tmp_instagram_${Date.now()}.mp4`)

  try {
    // استدعاء الـ API بالرابط ديال إنستغرام
    let response = await fetch(`https://koby-api.vercel.app/?url=${encodeURIComponent(args[0])}`)
    let res = await response.json()

    if (res.status && res.result && res.result.length > 0) {
      // أخذ أول عنصر من النتيجة
      let i = res.result[0]
      
      // معرفة نوع الامتداد (mp4 للفيديو أو jpg للصورة) من الرابط، وإلا نديرو mp4 كاِفتراض
      let fileExt = i.url.includes('.jpg') || i.url.includes('.jpeg') ? 'jpg' : 'mp4'
      // تحديث المسار بالامتداد الصحيح
      filePath = filePath.replace('.mp4', `.${fileExt}`)

      // تحميل الملف وتحويله لـ Buffer وحفظه في السيرفر كمّا طلبتي
      const buffer = await (await fetch(i.url)).arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));

      // إرسال الملف المحفوظ للمستخدم في الشات
      await conn.sendFile(m.chat, filePath, `instagram.${fileExt}`, '*✅ تم التنزيل!*', m);
      m.react(done)

      // مسح الملف المؤقت من السيرفر باش ما تعمرش الذاكرة
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    } else {
      throw "لم يتم العثور على روابط في النتيجة المستلمة"
    }

  } catch (error) {
    console.error(error)
    m.reply("error intente mas tarde") 
    
    // تأكيد مسح الملف في حالة حدوث خطأ وسط العملية
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}

handler.help = ['instagram'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = ['ig', "instagramdl", "instagram"]
handler.diamond = false

export default handler