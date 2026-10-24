// 每日預熱(排程):收盤資料進來後,先把「進場訊號榜」與熱門股訊號、ETF 專區算好放進 CDN——第一位訪客也不用等
// 排程設定在 netlify.toml。© 2026 阿康(goodskang)
const sigKey = () => { const t = new Date(Date.now() + 8 * 3600e3); if(t.getUTCHours() * 60 + t.getUTCMinutes() < 14 * 60 + 35) t.setUTCDate(t.getUTCDate() - 1); return t.toISOString().slice(0, 10).replace(/-/g, ''); };
exports.handler = async () => {
  const base = process.env.URL || 'https://stock.goodskang.tw', k = sigKey(), t0 = Date.now(), log = [];
  const hit = async u => { try{ const r = await fetch(base + u); await r.text(); log.push(`${r.status} ${u}`); }catch(e){ log.push(`ERR ${u}`); } };
  await hit(`/.netlify/functions/page/picks?k=${k}`);
  await Promise.all([hit('/.netlify/functions/page/list'), hit('/.netlify/functions/etfhot?v=1'), ...[0, 1, 2].map(g => hit(`/.netlify/functions/etf?v=3&g=${g}`))]);
  console.log(`warm k=${k} ${Date.now() - t0}ms\n` + log.join('\n'));
  return {statusCode: 200, body: 'ok'};
};
