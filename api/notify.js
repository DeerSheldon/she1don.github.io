/**
 * Vercel Serverless Function — 将 chatroom 留言推送到微信
 *
 * 使用 Server酱 (sct.ftqq.com) 的微信推送服务
 * 需要在 Vercel 环境变量中设置 SERVERCHAN_KEY
 */

export default async function handler(req, res) {
  // 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, time } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: '缺少 message 字段' });
  }

  const key = process.env.SERVERCHAN_KEY;

  if (!key) {
    console.error('SERVERCHAN_KEY 环境变量未设置');
    return res.status(500).json({ error: '服务端配置缺失' });
  }

  try {
    const resp = await fetch(
      `https://sctapi.ftqq.com/${key}.send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '📨 生日网站收到新留言！',
          desp: `**留言内容：**\n> ${message}\n\n**发送时间：**\n${time || '未知'}`,
        }),
      }
    );

    const result = await resp.json();

    if (result.code === 0) {
      console.log('✅ 微信推送成功');
      return res.status(200).json({ ok: true });
    } else {
      console.error('推送失败:', JSON.stringify(result));
      return res.status(502).json({ ok: false, info: result.info || 'unknown error' });
    }
  } catch (err) {
    console.error('请求 Server酱 API 失败:', err.message);
    return res.status(502).json({ ok: false, error: '推送服务不可达' });
  }
}
