const axios = require('axios');
const ytdl = require('@distube/ytdl-core');

// ==================== تيك توك (بدون علامة، أعلى دقة) ====================
async function tiktok(url) {
  const { data } = await axios.get('https://www.tikwm.com/api/', {
    params: { url, hd: 1 },
  });

  if (data.code !== 0) throw new Error('فشل استخراج');

  const media = [];

  // HD بدون علامة مائية
  if (data.data.hdplay) {
    media.push({ type: 'video', url: 'https://www.tikwm.com' + data.data.hdplay });
  } else if (data.data.play) {
    media.push({ type: 'video', url: 'https://www.tikwm.com' + data.data.play });
  }

  // صور (لو Slider)
  if (data.data.images && data.data.images.length) {
    data.data.images.forEach(img => media.push({ type: 'image', url: img }));
  }

  return { title: data.data.title || 'TikTok', media };
}

// ==================== انستقرام (أعلى دقة متاحة) ====================
async function instagram(url) {
  const res = await axios.post(
    'https://snapinsta.app/action.php',
    new URLSearchParams({ url }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }
  );

  const html = res.data;

  // نفضّل mp4 بأعلى دقة، ثم صور
  const videos = [...html.matchAll(/href="(https:\/\/[^"]+\.mp4[^"]*)"/g)].map(m => m[1]);
  const images = [...html.matchAll(/href="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/g)].map(m => m[1]);

  // إزالة التكرار
  const uniqVideos = [...new Set(videos)];
  const uniqImages = [...new Set(images)];

  const media = [
    ...uniqVideos.map(u => ({ type: 'video', url: u })),
    ...uniqImages.map(u => ({ type: 'image', url: u })),
  ];

  if (!media.length) throw new Error('فشل');

  return { title: 'Instagram', media };
}

// ==================== يوتيوب (أعلى دقة ممكنة) ====================
async function youtube(url) {
  const info = await ytdl.getInfo(url);

  // ناخذ أعلى دقة فيها صوت + صورة
  let format = ytdl.chooseFormat(info.formats, {
    quality: 'highest',
    filter: 'videoandaudio',
  });

  // لو ما لكينا combined، ناخذ أعلى فيديو (بدون صوت) كـ fallback
  if (!format) {
    format = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
    });
  }

  if (!format || !format.url) throw new Error('فشل استخراج الفيديو');

  return {
    title: info.videoDetails.title,
    media: [{ type: 'video', url: format.url }],
  };
}

// ==================== تويتر / X (أعلى دقة) ====================
async function twitter(url) {
  const id = url.match(/status\/(\d+)/)?.[1];
  if (!id) throw new Error('رابط غير صالح');

  const { data } = await axios.get(`https://api.vxtwitter.com/Twitter/status/${id}`);

  if (!data.mediaURLs || !data.mediaURLs.length) {
    throw new Error('ما فيه ميديا');
  }

  const media = data.mediaURLs.map(u => ({
    type: u.includes('.mp4') ? 'video' : 'image',
    url: u,
  }));

  return { title: data.user_name || 'Twitter', media };
}

// ==================== التصدير ====================
module.exports = { tiktok, instagram, youtube, twitter };