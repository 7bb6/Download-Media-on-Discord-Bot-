require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { tiktok, instagram, youtube, twitter } = require('./utils');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const TOKEN = process.env.TOKEN;

// كشف المنصة
function detect(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  if (!match) return null;
  const url = match[0];

  if (url.includes('tiktok.com')) return { fn: tiktok, url };
  if (url.includes('instagram.com')) return { fn: instagram, url };
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { fn: youtube, url };
  if (url.includes('twitter.com') || url.includes('x.com')) return { fn: twitter, url };
  return null;
}

client.once('ready', () => console.log(`✅ ${client.user.tag} شغال (خاص فقط)`));

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // ✅ نشتغل بالخاص فقط — نتجاهل السيرفرات
  if (msg.guild) return;

  // إذا ما فيه رابط → تجاهل
  if (!msg.content.includes('http')) return;

  const detected = detect(msg.content);

  // رابط غير مدعوم
  if (!detected) {
    return msg.reply('❌ الرابط غير صالح أو غير مدعوم');
  }

  // إشعار انتظار (بالخاص msg.reply يشتغل عادي)
  const loading = await msg.reply('⏳ جاري التحميل...');

  try {
    const result = await detected.fn(detected.url);

    if (!result || !result.media || !result.media.length) {
      return loading.edit('❌ ما لكيت محتوى قابل للتحميل');
    }

    // إرسال الميديا
    for (const item of result.media) {
      await msg.channel.send({
        content: item.type === 'video' ? `🎬 **${result.title}**` : null,
        files: [item.url],
      });
    }

    // نحذف رسالة الانتظار بعد النجاح (بالخاص تقدر تحذف رسائلك)
    try { await loading.delete(); } catch {}

  } catch (err) {
    console.error('[ERROR]', err.message);
    loading.edit('❌ فشل التحميل، جرب رابط ثاني');
  }
});

client.login(TOKEN);