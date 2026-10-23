// ETF 存股專區:伺服器端一次算好熱門 ETF 的含息報酬、最大回檔、殖利率、配息頻率、填息、定期定額回測
// 結果在 Netlify CDN 快取 6 小時——全站共用一份,不會每位訪客各打幾十次 FinMind。© 2026 阿康(goodskang)
const LIST = [
  ['0050', '市值型'], ['006208', '市值型'], ['00692', '市值型'], ['00850', '市值型'],
  ['0056', '高股息'], ['00878', '高股息'], ['00919', '高股息'], ['00929', '高股息'], ['00713', '高股息'], ['00918', '高股息'], ['00940', '高股息'],
  ['00646', '海外'], ['00662', '海外'],
  ['00679B', '債券'], ['00687B', '債券'],
];
const FM = 'https://api.finmindtrade.com/api/v4/data?';
const ymd = d => d.toISOString().slice(0, 10);
async function get(ds, id, start, end){
  for(let a = 0; a < 2; a++){
    try{
      const r = await fetch(FM + new URLSearchParams({dataset: ds, data_id: id, start_date: start, end_date: end}));
      const j = await r.json();
      if(j.status === 200) return j.data || [];
    }catch(e){}
    await new Promise(r => setTimeout(r, 800));
  }
  return null;
}
async function calcOne(id, cat){
  const now = new Date(), end = ymd(now);
  const s0 = new Date(now); s0.setFullYear(s0.getFullYear() - 3); s0.setDate(s0.getDate() - 10);
  const start = ymd(s0);
  const [px, sp, dv, info] = await Promise.all([
    get('TaiwanStockPrice', id, start, end), get('TaiwanStockSplitPrice', id, start, end),
    get('TaiwanStockDividendResult', id, start, end), get('TaiwanStockInfo', id, '', '')]);
  if(!px || px.length < 30) return {id, cat, err: 'no data'};
  const d = px.filter(x => x.close > 0).map(x => ({date: x.date, close: x.close, raw: x.close}));
  const splits = (sp || []).filter(s => s.before_price > 0 && s.after_price > 0).map(s => ({date: s.date, f: s.after_price / s.before_price}));
  const divs = (dv || []).filter(x => x.before_price > 0 && x.after_price > 0);
  // 還原:分割+除息事件日之前的價格乘上係數 → 含息總報酬序列(股息再投入)
  const evs = splits.map(s => ({date: s.date, f: s.f})).concat(divs.map(x => ({date: x.date, f: x.after_price / x.before_price})));
  for(const ev of evs) for(const r of d) if(r.date < ev.date) r.close *= ev.f;
  // 分割係數(只算分割),用來把分割前的股息與價格換算成今天的股數基準
  const splitF = date => splits.filter(s => s.date > date).reduce((a, s) => a * s.f, 1);
  const n = d.length, last = d[n - 1];
  const atAgo = days => { const t = new Date(last.date); t.setDate(t.getDate() - days); const ts = ymd(t); return d.findIndex(r => r.date >= ts); };
  const i1 = atAgo(365), i3 = atAgo(365 * 3);
  const first = d[0];
  const has3 = new Date(first.date) <= new Date(new Date(last.date).getTime() - (365 * 3 - 12) * 864e5);
  const has1 = new Date(first.date) <= new Date(new Date(last.date).getTime() - (365 - 7) * 864e5);
  const ret = i => i >= 0 ? last.close / d[i].close - 1 : null;
  const mdd = from => { let pk = 0, m = 0, pkD = '', trD = ''; let curPk = ''; for(let k = from; k < n; k++){ if(d[k].close > pk){ pk = d[k].close; curPk = d[k].date; } const x = d[k].close / pk - 1; if(x < m){ m = x; pkD = curPk; trD = d[k].date; } } return {v: m, peak: pkD, trough: trD}; };
  const m3 = mdd(has3 ? i3 : 0), m1 = mdd(has1 ? i1 : 0);
  // 現在離近一年高點多遠;過去(可得期間)每天的回檔深度分佈,算「比現在跌更深的日子佔幾 %」
  let pk1 = 0; for(let k = Math.max(0, i1); k < n; k++) pk1 = Math.max(pk1, d[k].close);
  const ddNow = last.close / pk1 - 1;
  const dds = []; { let pk = 0; for(let k = 0; k < n; k++){ pk = Math.max(pk, d[k].close); dds.push(d[k].close / pk - 1); } }
  const deeper = dds.filter(x => x < ddNow).length / dds.length;
  // 配息:近 12 個月現金股息(換算成今天的股數基準)
  const t12 = ymd(new Date(new Date(last.date).getTime() - 365 * 864e5));
  const cash = divs.filter(x => x.date > t12 && /息/.test(x.stock_or_cache_dividend || '息'));
  const ttm = cash.reduce((a, x) => a + (x.stock_and_cache_dividend || 0) * splitF(x.date), 0);
  const freq = cash.length >= 10 ? '月配' : cash.length >= 4 ? '季配' : cash.length >= 2 ? '半年配' : cash.length === 1 ? '年配' : '不配息';
  // 最近一次除息的填息狀況(用原始價)
  let fill = null;
  const lastDiv = divs.length ? divs[divs.length - 1] : null;
  if(lastDiv){
    const after = px.filter(x => x.date >= lastDiv.date);
    const hit = after.find(x => x.close >= lastDiv.before_price);
    fill = {date: lastDiv.date, amt: lastDiv.stock_and_cache_dividend, filled: !!hit,
      days: hit ? Math.round((new Date(hit.date) - new Date(lastDiv.date)) / 864e5) : Math.round((new Date(last.date) - new Date(lastDiv.date)) / 864e5)};
  }
  // 定期定額回測:近 3 年(或成立以來)每月第一個交易日投入 1 萬,用含息序列(股息再投入),不含手續費
  let dca = null;
  { const from = has3 ? i3 : 0; let units = 0, inv = 0, mon = ''; for(let k = from; k < n; k++){ const m = d[k].date.slice(0, 7); if(m !== mon){ mon = m; units += 10000 / d[k].close; inv += 10000; } }
    dca = {months: inv / 10000, invested: inv, value: Math.round(units * last.close), ret: units * last.close / inv - 1}; }
  return {id, cat, name: info && info[0] ? info[0].stock_name : '', price: last.raw, date: last.date, since: first.date,
    r1: has1 ? ret(i1) : null, r3: has3 ? ret(i3) : null, r3a: has3 ? Math.pow(1 + ret(i3), 1 / 3) - 1 : null,
    mdd3: m3.v, mdd3Peak: m3.peak, mdd3Trough: m3.trough, mdd1: m1.v, ddNow, deeper, ttm: Math.round(ttm * 1000) / 1000,
    yld: last.raw > 0 ? ttm / last.raw : 0, freq, nDiv: cash.length, fill, dca, has3, has1};
}
exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  let list = LIST;
  if(q.id){ const id = String(q.id).toUpperCase().trim(); if(!/^\d{4,6}[A-Z]?$/.test(id)) return {statusCode: 400, body: '{"err":"bad id"}'}; list = [[id, '自選']]; }
  // 分組:g=0/1/2 各算 5 檔(前端三組平行抓)——單次函式控制在 10 秒內,各組各自快取
  if(!q.id && q.g != null){ const g = Math.max(0, Math.min(2, parseInt(q.g) || 0)); list = LIST.slice(g * 5, g * 5 + 5); }
  const out = await Promise.all(list.map(([id, cat]) => calcOne(id, cat).catch(e => ({id, cat, err: String(e)}))));
  const ok = out.filter(x => !x.err).length;
  return {statusCode: 200,
    headers: {'content-type': 'application/json',
      'cache-control': 'public, max-age=600',
      'netlify-cdn-cache-control': ok >= Math.ceil(list.length * 0.7) ? 'public, s-maxage=21600, stale-while-revalidate=86400, durable' : 'no-store'},
    body: JSON.stringify({t: new Date().toISOString(), list: out})};
};
