// 話題雷達 v4:每檔單一請求抓整窗(請求量砍半,防 FinMind 限流)+空結果不快取(以前空的被 CDN 記 30 分鐘)
// 同稿跨媒體、跨日轉發只計一次。客觀計數,非選股推薦。© 2026 阿康(goodskang)
const POOL = ['2330','2303','2317','2454','2382','3231','6669','2376','2356','3008','3406','4958','3376','4938','2474','3324','3017','3653','2368','2408','2344','8299','2337','2327','2308','2301','3665','2059','8210','2345','2412','2603','2609','2615','2618','2610','2882','2881','2891','1519','1513','6415','3034','3037','8046','8039','6213','3323','6805','2049','3661','3443','2383','3711','2379'];
const THEMES = [
  {name: '摺疊機', k: ['摺疊']},
  {name: '輝達', k: ['輝達', 'NVIDIA', 'Nvidia', 'nvidia', '黃仁勳']},
  {name: '蘋果', k: ['蘋果', 'iPhone', 'iphone', 'Apple']},
  {name: 'AI 伺服器', k: ['伺服器', 'AI伺服器', 'GB300', 'NVL']},
  {name: '記憶體', k: ['記憶體', 'DRAM', 'NAND', 'HBM']},
  {name: 'PCB/載板', k: ['PCB', '載板', '銅箔', 'PTFE']},
  {name: '散熱', k: ['散熱', '水冷']},
  {name: '機器人', k: ['機器人']},
  {name: '財報/法說', k: ['財報', '法說', '營收']}
];
const BAD = /權證|認購|牛熊|售[0-9]|申購/;

exports.handler = async () => {
  const twNow = new Date(Date.now() + 8 * 3600 * 1000);
  const iso = dt => dt.toISOString().slice(0, 10);
  const isWE = dt => { const w = dt.getUTCDay(); return w === 0 || w === 6; };
  // 時間窗:今天+昨天(約 36 小時);昨天若是週末,一路往回延伸到週五——週一早上=五六日一全算
  const days = [iso(twNow)];
  let cur = new Date(twNow.getTime() - 86400000);
  days.push(iso(cur));
  while(isWE(cur)){ cur = new Date(cur.getTime() - 86400000); days.push(iso(cur)); }
  const cleanT = t => String(t || '').split(' - ')[0].replace(/[<>&"']/g, '').trim();
  const fetchRaw = async (id, d) => {
    try{
      const r = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockNews&data_id=${id}&start_date=${d}`);
      const j = await r.json();
      return j.data || [];
    }catch(e){ return []; }
  };
  const okDates = new Set(days);
  const fetchStock = async id => {
    // 一檔一請求:start=時間窗最舊日(FinMind 預設抓到今天),回來再按日期過濾——請求量從 2~3 倍砍回 1 倍
    const rows = await fetchRaw(id, days[Math.min(days.length, 3) - 1]);
    const seen = new Set(), out = [];
    let mkt = 0;
    for(const x of rows){
      if(!okDates.has(String(x.date || '').slice(0, 10))) continue;
      if((x.link || '').includes('cmoney.tw/forum')) continue;
      const t = cleanT(x.title);
      if(!t) continue;
      const key = t.slice(0, 18);
      if(seen.has(key)) continue;
      seen.add(key);
      if(BAD.test(t)){ mkt++; continue; }
      out.push({t, link: (x.link || '').startsWith('http') ? x.link : ''});
    }
    return {out, mkt};
  };
  // 時間預算:Netlify 免費函式 10 秒上限,週末視窗會拉到 3 天(請求量 ×3)——逼近上限就先回傳已抓到的
  const DEADLINE = Date.now() + 7500;
  const rows = [];
  for(let i = 0; i < POOL.length; i += 22){
    if(Date.now() > DEADLINE) break;
    const part = await Promise.all(POOL.slice(i, i + 22).map(fetchStock));
    rows.push(...part);
  }
  const res = POOL.slice(0, rows.length).map((id, i) => ({id, list: rows[i].out, mkt: rows[i].mkt})).filter(x => x.list.length > 0 || x.mkt >= 3);
  // 主題聚類:同一主題詞出現在哪些股票的標題裡,就是市場正在寫的供應鏈
  const themes = [];
  for(const th of THEMES){
    const stocks = [];
    for(const x of res){
      const hits = x.list.filter(nw => th.k.some(kw => nw.t.includes(kw))).length;
      if(hits > 0) stocks.push({id: x.id, n: hits});
    }
    if(stocks.length >= 2){
      stocks.sort((a, b) => b.n - a.n);
      themes.push({name: th.name, score: stocks.reduce((a, s) => a + s.n, 0), stocks: stocks.slice(0, 4)});
    }
  }
  themes.sort((a, b) => b.score - a.score);
  const top = res.map(x => {
    const last = x.list[x.list.length - 1];
    return {id: x.id, n: x.list.length, m: x.mkt,
      t: last ? last.t.slice(0, 40) : '(僅權證/行銷稿)', link: last ? last.link : ''};
  }).sort((a, b) => (b.n - a.n) || (b.m - a.m)).slice(0, 15);
  // 空結果=被限流或冷啟動失敗——絕對不能進 CDN 快取,否則接下來 30 分鐘所有人都看不到
  const ok = top.length >= 3;
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': ok ? 'public, max-age=1800' : 'no-store'},
    body: JSON.stringify({day: `${days[days.length - 1]} ~ ${days[0]}`, top, themes: themes.slice(0, 3)})
  };
};
