// 盤後強勢股掃描:伺服器端抓證交所+櫃買全市場收盤,回傳客觀排序(免瀏覽器 CORS 問題)
// © 2026 阿康(goodskang)
exports.handler = async () => {
  const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const list = [];
  try{
    const arr = await (await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL')).json();
    for(const x of (arr || [])){
      const c = num(x.ClosingPrice), ch = num(x.Change), val = num(x.TradeValue), prev = c - ch;
      if(c >= 10 && prev > 0 && val >= 1e8 && /^[1-9][0-9]{3}$/.test(x.Code || ''))
        list.push({id: x.Code, name: x.Name, c, pct: +(ch / prev * 100).toFixed(2), val: Math.round(val)});
    }
  }catch(e){}
  try{
    const arr = await (await fetch('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes')).json();
    for(const x of (arr || [])){
      const id = x.SecuritiesCompanyCode || x.Code;
      const c = num(x.Close), ch = num(x.Change), val = num(x.TransactionAmount), prev = c - ch;
      if(c >= 10 && prev > 0 && val >= 1e8 && /^[1-9][0-9]{3}$/.test(id || ''))
        list.push({id, name: x.CompanyName || id, c, pct: +(ch / prev * 100).toFixed(2), val: Math.round(val)});
    }
  }catch(e){}
  const hot = list.filter(x => x.pct >= 5).sort((a, b) => b.pct - a.pct).slice(0, 15);
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=600'},
    body: JSON.stringify(hot)
  };
};
