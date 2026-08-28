// 盤後強勢股掃描 v3:上市改用證交所 MI_INDEX(約 14:00 更新,快)+上櫃 openapi(官方更新較晚)
// 附資料日;假日自動回溯。客觀排序,非選股建議。© 2026 阿康(goodskang)
exports.handler = async () => {
  const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const pad = n => String(n).padStart(2, '0');
  const fetchMI = async d8 => {
    try{
      const r = await fetch(`https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${d8}&type=ALLBUT0999&response=json`,
        {headers: {'User-Agent': 'Mozilla/5.0'}});
      const j = await r.json();
      const t = (j.tables || []).find(tb => (tb.fields || []).includes('證券代號'));
      if(!t) return [];
      const f = t.fields;
      const iC = f.indexOf('證券代號'), iN = f.indexOf('證券名稱'), iV = f.indexOf('成交金額'),
            iCl = f.indexOf('收盤價'), iS = f.indexOf('漲跌(+/-)'), iD = f.indexOf('漲跌價差');
      const out = [];
      for(const row of (t.data || [])){
        const id = String(row[iC]).trim();
        if(!/^[1-9][0-9]{3}$/.test(id)) continue;
        const c = num(row[iCl]), val = num(row[iV]);
        let ch = num(row[iD]);
        const sign = String(row[iS] || '');
        if(sign.includes('green') || sign.includes('->-<') || />-</.test(sign)) ch = -ch;
        const prev = c - ch;
        if(c >= 10 && prev > 0 && val >= 1e8)
          out.push({id, name: String(row[iN]).trim(), c, pct: +(ch / prev * 100).toFixed(2), val: Math.round(val)});
      }
      return out;
    }catch(e){ return []; }
  };
  // 上市:MI_INDEX,假日/未發布自動往回找最近交易日
  let list = [], usedDate = '';
  const tw = new Date(Date.now() + 8 * 3600 * 1000);
  for(let b = 0; b < 6 && !list.length; b++){
    const d = new Date(tw.getTime() - b * 86400000);
    const dow = d.getUTCDay();
    if(dow === 0 || dow === 6) continue;
    const y = d.getUTCFullYear(), m = pad(d.getUTCMonth() + 1), dd = pad(d.getUTCDate());
    list = await fetchMI(`${y}${m}${dd}`);
    if(list.length) usedDate = `${y}-${m}-${dd}`;
  }
  // 上市備援:openapi(MI_INDEX 整組失敗才用)
  if(!list.length){
    try{
      const arr = await (await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL')).json();
      for(const x of (arr || [])){
        const c = num(x.ClosingPrice), ch = num(x.Change), val = num(x.TradeValue), prev = c - ch;
        if(c >= 10 && prev > 0 && val >= 1e8 && /^[1-9][0-9]{3}$/.test(x.Code || ''))
          list.push({id: x.Code, name: x.Name, c, pct: +(ch / prev * 100).toFixed(2), val: Math.round(val)});
      }
    }catch(e){}
  }
  // 上櫃:openapi(官方更新較晚,可能落後上市半天)
  try{
    const arr = await (await fetch('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes')).json();
    for(const x of (arr || [])){
      const id = x.SecuritiesCompanyCode || x.Code;
      const c = num(x.Close), ch = num(x.Change), val = num(x.TransactionAmount), prev = c - ch;
      if(c >= 10 && prev > 0 && val >= 1e8 && /^[1-9][0-9]{3}$/.test(id || ''))
        list.push({id, name: x.CompanyName || id, c, pct: +(ch / prev * 100).toFixed(2), val: Math.round(val)});
    }
  }catch(e){}
  // 組成:人氣王 3 檔(成交值最大、漲幅 ≥2%)+ 強勢股 9 檔(漲幅排序)
  const hot = list.filter(x => x.pct >= 5).sort((a, b) => b.pct - a.pct).slice(0, 9);
  const used = new Set(hot.map(x => x.id));
  const kings = list.filter(x => x.pct >= 2 && !used.has(x.id)).sort((a, b) => b.val - a.val).slice(0, 3).map(x => Object.assign({}, x, {k: 1}));
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=300'},
    body: JSON.stringify({d: usedDate, list: kings.concat(hot)})
  };
};
