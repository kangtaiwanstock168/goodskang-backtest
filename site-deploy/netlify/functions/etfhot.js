// ETF 熱門榜:證交所 MI_INDEX(type=0099P,ETF 專區)+櫃買 openapi(上櫃債券 ETF),依當日成交量(張)排序
// 假日自動回溯最近交易日;CDN 快取 30 分鐘。客觀排序,非推薦。© 2026 阿康(goodskang)
exports.handler = async () => {
  const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const pad = n => String(n).padStart(2, '0');
  const fetchMI = async d8 => {
    try{
      const r = await fetch(`https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${d8}&type=0099P&response=json`, {headers: {'User-Agent': 'Mozilla/5.0'}});
      const j = await r.json();
      const t = (j.tables || []).find(tb => (tb.fields || []).includes('證券代號'));
      if(!t) return [];
      const f = t.fields;
      const iC = f.indexOf('證券代號'), iN = f.indexOf('證券名稱'), iQ = f.indexOf('成交股數'), iV = f.indexOf('成交金額'),
            iCl = f.indexOf('收盤價'), iS = f.indexOf('漲跌(+/-)'), iD = f.indexOf('漲跌價差');
      const out = [];
      for(const row of (t.data || [])){
        const id = String(row[iC]).trim(); if(!/^00\d{2,4}[A-Z]?$/.test(id)) continue;
        const c = num(row[iCl]); let ch = num(row[iD]); const sign = String(row[iS] || '');
        if(sign.includes('green') || />-</.test(sign)) ch = -ch;
        const prev = c - ch;
        out.push({id, name: String(row[iN]).trim(), c, pct: prev > 0 ? +(ch / prev * 100).toFixed(2) : 0, lots: Math.round(num(row[iQ]) / 1000), val: Math.round(num(row[iV])), mk: '上市'});
      }
      return out;
    }catch(e){ return []; }
  };
  let list = [], d = '';
  const tw = new Date(Date.now() + 8 * 3600 * 1000);
  for(let b = 0; b < 7 && !list.length; b++){
    const x = new Date(tw.getTime() - b * 864e5); const dow = x.getUTCDay(); if(dow === 0 || dow === 6) continue;
    const y = x.getUTCFullYear(), m = pad(x.getUTCMonth() + 1), dd = pad(x.getUTCDate());
    list = await fetchMI(`${y}${m}${dd}`); if(list.length) d = `${y}-${m}-${dd}`;
  }
  try{
    const arr = await (await fetch('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes')).json();
    for(const x of (arr || [])){
      const id = String(x.SecuritiesCompanyCode || x.Code || '').trim(); if(!/^00\d{2,4}[A-Z]?$/.test(id)) continue;
      const c = num(x.Close), ch = num(x.Change), prev = c - ch;
      list.push({id, name: String(x.CompanyName || id).trim(), c, pct: prev > 0 ? +(ch / prev * 100).toFixed(2) : 0, lots: Math.round(num(x.TradingShares) / 1000), val: Math.round(num(x.TransactionAmount)), mk: '上櫃'});
    }
  }catch(e){}
  list.sort((a, b) => b.lots - a.lots);
  return {statusCode: 200, headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=300',
      'netlify-cdn-cache-control': list.length >= 30 ? 'public, s-maxage=1800, stale-while-revalidate=21600, durable' : 'no-store'},
    body: JSON.stringify({d, list: list.slice(0, 40)})};
};
