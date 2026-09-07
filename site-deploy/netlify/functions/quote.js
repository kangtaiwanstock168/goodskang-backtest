// 盤中即時報價代理 v2:證交所 MIS 即時快照為主(官方、即時)+ Yahoo 補分時走勢/VWAP(Yahoo 台股延遲 15~20 分)
// © 2026 阿康(goodskang)
exports.handler = async (event) => {
  const ids = ((event.queryStringParameters || {}).ids || '')
    .split(',').map(s => s.trim().toUpperCase())
    .filter(s => /^([0-9]{4,6}[A-Z]?|TAIEX)$/.test(s)).slice(0, 9);
  const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const out = {};

  // ── 第一層:證交所 MIS 官方即時快照(上市 tse_ / 上櫃 otc_ 都塞,MIS 只回存在的那個)──
  const mis = {};
  try{
    const chs = ids.map(id => id === 'TAIEX' ? 'tse_t00.tw' : `tse_${id.toLowerCase()}.tw|otc_${id.toLowerCase()}.tw`).join('|');
    const r0 = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${chs}&json=1&delay=0&_=${Date.now()}`,
      {headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Accept': 'application/json'}});
    if(r0.ok){
      const j0 = await r0.json();
      for(const m of (j0.msgArray || [])){
        const id = m.c === 't00' ? 'TAIEX' : String(m.c || '').toUpperCase();
        // z=最新成交價;瞬間無成交會是 '-',用買一/賣一中價或昨收頂上
        let p = num(m.z);
        if(!(p > 0)){
          const b1 = num(String(m.b || '').split('_')[0]), a1 = num(String(m.a || '').split('_')[0]);
          p = (b1 > 0 && a1 > 0) ? +((b1 + a1) / 2).toFixed(2) : (b1 > 0 ? b1 : (a1 > 0 ? a1 : 0));
        }
        if(!(p > 0)) continue;
        mis[id] = {p, prev: num(m.y), o: num(m.o), h: num(m.h), l: num(m.l),
          vol: Math.round(num(m.v) * 1000)};   // MIS 累積量單位=張 → 換算成股,跟 Yahoo 同基準
      }
    }
  }catch(e){}

  // ── 第二層:Yahoo 分時序列(畫走勢圖、算 VWAP);價/量若 MIS 有,以 MIS 為準 ──
  await Promise.all(ids.map(async id => {
    const syms = id === 'TAIEX' ? ['%5ETWII'] : [id + '.TW', id + '.TWO'];
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
        if(p > 0 || mis[id]){
          const g = mis[id] || {};
          // 官方即時價優先;走勢序列尾端補上即時價,圖的最後一點才不會停在 20 分鐘前
          const sArr = series.map(v => +v.toFixed(2));
          if(g.p > 0 && sArr.length && Math.abs(sArr[sArr.length-1] - g.p) > 0.001) sArr.push(g.p);
          out[id] = {p: g.p > 0 ? g.p : p, prev: g.prev > 0 ? g.prev : prev, series: sArr,
            o: g.o > 0 ? g.o : o, h: g.h > 0 ? g.h : h, l: g.l > 0 ? g.l : l,
            vol: g.vol > 0 ? g.vol : vol, vwap, rt: g.p > 0 ? 1 : 0};
          return;
        }
      }catch(e){}
    }
    // Yahoo 全滅但 MIS 有:純官方快照也能用(沒有走勢線而已)
    if(!out[id] && mis[id]) out[id] = Object.assign({series: [], vwap: 0, rt: 1}, mis[id]);
  }));
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=15'},
    body: JSON.stringify(out)
  };
};
