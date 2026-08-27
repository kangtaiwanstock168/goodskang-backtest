// 話題雷達:統計主流資產池近一日「新聞報導則數」,照熱度排序——客觀計數,非選股推薦
// © 2026 阿康(goodskang)
const POOL = ['2330','2317','2454','2382','3231','6669','2376','2356','3008','3406','4958','3376','4938','2474','3324','3017','3653','2368','2408','2344','8299','2337','2327','2308','2301','3665','2059','8210','2345','2412','2603','2609','2615','2618','2610','2882','2881','2891','1519','1513','6415','3034','3037','8046'];

exports.handler = async () => {
  const twNow = new Date(Date.now() + 8 * 3600 * 1000);
  const today = twNow.toISOString().slice(0, 10);
  const yest = new Date(twNow.getTime() - 86400000).toISOString().slice(0, 10);
  const fetchDay = async (id, d) => {
    try{
      const r = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockNews&data_id=${id}&start_date=${d}`);
      const j = await r.json();
      return (j.data || []).filter(x => !((x.link || '').includes('cmoney.tw/forum')));
    }catch(e){ return []; }
  };
  const agg = async d => {
    const rows = [];
    for(let i = 0; i < POOL.length; i += 12){
      const part = await Promise.all(POOL.slice(i, i + 12).map(id => fetchDay(id, d)));
      rows.push(...part);
    }
    return POOL.map((id, i) => ({id, list: rows[i]})).filter(x => x.list.length > 0);
  };
  let day = today, res = await agg(today);
  const tot = res.reduce((a, x) => a + x.list.length, 0);
  if(tot < 8){
    const r2 = await agg(yest);
    if(r2.reduce((a, x) => a + x.list.length, 0) > tot){ res = r2; day = yest; }
  }
  const clean = t => String(t || '').split(' - ')[0].replace(/[<>&"']/g, '').slice(0, 40);
  const top = res.map(x => {
    const last = x.list[x.list.length - 1];
    return {id: x.id, n: x.list.length, t: clean(last.title), link: (last.link || '').startsWith('http') ? last.link : ''};
  }).sort((a, b) => b.n - a.n).slice(0, 9);
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=1800'},
    body: JSON.stringify({day, top})
  };
};
