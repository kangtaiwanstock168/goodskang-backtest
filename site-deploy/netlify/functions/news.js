// 話題雷達 v2:新聞報導則數排序+主題聚類(從標題關鍵字自動抓供應鏈)——客觀計數,非選股推薦
// 已過濾:論壇貼文、權證行銷稿;同標題跨媒體轉發只計一次
// © 2026 阿康(goodskang)
const POOL = ['2330','2317','2454','2382','3231','6669','2376','2356','3008','3406','4958','3376','4938','2474','3324','3017','3653','2368','2408','2344','8299','2337','2327','2308','2301','3665','2059','8210','2345','2412','2603','2609','2615','2618','2610','2882','2881','2891','1519','1513','6415','3034','3037','8046','8039','6213','3323','6805','2049','3661','3443','2383'];
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
  const today = twNow.toISOString().slice(0, 10);
  const yest = new Date(twNow.getTime() - 86400000).toISOString().slice(0, 10);
  const cleanT = t => String(t || '').split(' - ')[0].replace(/[<>&"']/g, '').trim();
  const fetchDay = async (id, d) => {
    try{
      const r = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockNews&data_id=${id}&start_date=${d}`);
      const j = await r.json();
      const seen = new Set(), out = [];
      let mkt = 0;
      for(const x of (j.data || [])){
        if((x.link || '').includes('cmoney.tw/forum')) continue;
        const t = cleanT(x.title);
        if(!t) continue;
        const key = t.slice(0, 18);          // 同稿多發:取標題前段當去重鍵,轉發只計一次
        if(seen.has(key)) continue;
        seen.add(key);
        if(BAD.test(t)){ mkt++; continue; }  // 權證/行銷稿:不混入報導數,但另計——量大=有人在炒熱度
        out.push({t, link: (x.link || '').startsWith('http') ? x.link : ''});
      }
      return {out, mkt};
    }catch(e){ return {out: [], mkt: 0}; }
  };
  const agg = async d => {
    const rows = [];
    for(let i = 0; i < POOL.length; i += 12){
      const part = await Promise.all(POOL.slice(i, i + 12).map(id => fetchDay(id, d)));
      rows.push(...part);
    }
    return POOL.map((id, i) => ({id, list: rows[i].out, mkt: rows[i].mkt})).filter(x => x.list.length > 0 || x.mkt >= 3);
  };
  let day = today, res = await agg(today);
  const tot = res.reduce((a, x) => a + x.list.length + x.mkt, 0);
  if(tot < 8){
    const r2 = await agg(yest);
    if(r2.reduce((a, x) => a + x.list.length + x.mkt, 0) > tot){ res = r2; day = yest; }
  }
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
      t: last ? last.t.slice(0, 40) : '(今日僅權證/行銷稿)', link: last ? last.link : ''};
  }).sort((a, b) => (b.n - a.n) || (b.m - a.m)).slice(0, 15);
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=1800'},
    body: JSON.stringify({day, top, themes: themes.slice(0, 3)})
  };
};
