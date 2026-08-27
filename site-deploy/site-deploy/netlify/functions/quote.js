// 盤中即時報價代理:瀏覽器 → 本站函式 → Yahoo,繞過瀏覽器 CORS 限制
// © 2026 阿康(goodskang)
exports.handler = async (event) => {
  const ids = ((event.queryStringParameters || {}).ids || '')
    .split(',').map(s => s.trim().toUpperCase())
    .filter(s => /^([0-9]{4,6}[A-Z]?|TAIEX)$/.test(s)).slice(0, 9);
  const out = {};
  await Promise.all(ids.map(async id => {
    const syms = id === 'TAIEX' ? ['%5ETWII'] : [id + '.TW', id + '.TWO'];   // 加權指數走 Yahoo ^TWII
    for(const sym of syms){
      try{
        const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`,
          {headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}});
        if(!r.ok) continue;
        const j = await r.json();
        const res = j && j.chart && j.chart.result && j.chart.result[0];
        if(!res) continue;
        const m = res.meta || {};
        const q = res.indicators && res.indicators.quote && res.indicators.quote[0];
        let series = (q && q.close ? q.close : []).filter(v => v > 0);
        if(series.length > 80){
          const st = Math.ceil(series.length / 80);
          series = series.filter((v, i) => i % st === 0 || i === series.length - 1);
        }
        const p = m.regularMarketPrice > 0 ? m.regularMarketPrice : (series.length ? series[series.length-1] : 0);
        const prev = m.chartPreviousClose > 0 ? m.chartPreviousClose : (m.previousClose > 0 ? m.previousClose : 0);
        let o = 0, h = 0, l = 0, vol = 0;
        if(q){
          const op = (q.open || []).filter(v => v > 0), hh = (q.high || []).filter(v => v > 0), ll = (q.low || []).filter(v => v > 0);
          o = op.length ? op[0] : 0; h = hh.length ? Math.max(...hh) : 0; l = ll.length ? Math.min(...ll) : 0;
          vol = (q.volume || []).reduce((a, b) => a + (b > 0 ? b : 0), 0);
        }
        let vwap = 0;
        if(q && q.close && q.volume){
          let pv = 0, vv = 0;
          for(let k = 0; k < q.close.length; k++){ const cc = q.close[k], vo = q.volume[k]; if(cc > 0 && vo > 0){ pv += cc * vo; vv += vo; } }
          if(vv > 0) vwap = +(pv / vv).toFixed(2);
        }
        if(p > 0){ out[id] = {p, prev, series: series.map(v => +v.toFixed(2)), o, h, l, vol, vwap}; return; }
      }catch(e){}
    }
  }));
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=30'},
    body: JSON.stringify(out)
  };
};
