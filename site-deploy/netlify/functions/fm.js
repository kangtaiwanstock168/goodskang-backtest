// FinMind 資料代理備援:使用者 IP 被 FinMind 限流時,改由本站伺服器代抓
// 僅放行白名單參數,避免被當開放代理濫用。© 2026 阿康(goodskang)
exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const allowed = ['dataset', 'data_id', 'start_date', 'end_date'];
  const okDatasets = ['TaiwanStockPrice', 'TaiwanStockInfo', 'TaiwanStockSplitPrice', 'TaiwanStockDividendResult'];
  const p = new URLSearchParams();
  for(const k of allowed) if(q[k]) p.set(k, String(q[k]).slice(0, 40));
  if(!okDatasets.includes(p.get('dataset') || '') || !p.get('data_id')){
    return {statusCode: 400, headers: {'content-type': 'application/json'}, body: '{"status":400,"msg":"bad request","data":[]}'};
  }
  try{
    const r = await fetch('https://api.finmindtrade.com/api/v4/data?' + p.toString());
    const body = await r.text();
    return {statusCode: 200, headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=300'}, body};
  }catch(e){
    return {statusCode: 502, headers: {'content-type': 'application/json'}, body: '{"status":502,"msg":"upstream failed","data":[]}'};
  }
};
