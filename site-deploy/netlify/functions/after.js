// 盤後成交量:定價交易(BFT41U)+盤後零股(TWT53U)——給收盤後做功課的人「全日真量」
// 兩表約 14:30 後發布;假日/未發布自動回溯。單位統一回傳「股」。© 2026 阿康(goodskang)
exports.handler = async (event) => {
  const id = String((event.queryStringParameters || {}).id || '').trim();
  if(!/^[0-9]{4,6}$/.test(id)) return {statusCode: 400, body: '{"err":"bad id"}'};
  const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const pad = n => String(n).padStart(2, '0');
  // 從表中撈出該股的成交股數;單位防呆:若「數量×價 ≈ 金額×1000」代表數量是千股,改用 金額÷價 還原成股
  const pick = (j, qtyField) => {
    const t = (j.tables ? (j.tables.find(tb => (tb.fields || []).includes('證券代號')) || j) : j);
    const f = t.fields || j.fields || [];
    const iC = f.indexOf('證券代號'), iQ = f.indexOf(qtyField), iA = f.indexOf('成交金額'), iP = f.indexOf('成交價');
    if(iC < 0 || iQ < 0) return 0;
    for(const row of (t.data || j.data || [])){
      if(String(row[iC]).trim() !== id) continue;
      let q = num(row[iQ]);
      const amt = num(row[iA]), p = num(row[iP]);
      if(p > 0 && amt > 0){
        const sh = amt / p;
        if(q > 0 && Math.abs(q * 1000 - sh) / sh < 0.05) q = Math.round(sh);   // 千股 → 股
        if(q === 0) q = Math.round(sh);
      }
      return q;
    }
    return 0;
  };
  const get = async url => {
    try{
      const r = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
      const j = await r.json();
      return (j && j.stat === 'OK') ? j : null;
    }catch(e){ return null; }
  };
  const tw = new Date(Date.now() + 8 * 3600 * 1000);
  let fix = 0, odd = 0, usedDate = '';
  for(let b = 0; b < 6 && !usedDate; b++){
    const d = new Date(tw.getTime() - b * 86400000);
    const dow = d.getUTCDay();
    if(dow === 0 || dow === 6) continue;
    const d8 = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
    const [jF, jO] = await Promise.all([
      get(`https://www.twse.com.tw/rwd/zh/afterTrading/BFT41U?date=${d8}&selectType=ALL&response=json`),
      get(`https://www.twse.com.tw/rwd/zh/afterTrading/TWT53U?date=${d8}&selectType=ALL&response=json`)
    ]);
    if(jF || jO){
      usedDate = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      if(jF) fix = pick(jF, '成交數量');
      if(jO) odd = pick(jO, '成交股數');
    }
  }
  return {
    statusCode: 200,
    headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=600'},
    body: JSON.stringify({d: usedDate, fix, odd})
  };
};
