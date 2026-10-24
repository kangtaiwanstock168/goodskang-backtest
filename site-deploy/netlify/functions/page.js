// 個股/ETF 靜態分析頁(伺服器端渲染):給 Google 與 AI 工具讀得到的真實數據頁——/stock/2330
// 與網站同一套順勢檢查表與訊號卡規則(taChecklist 由 index.html 原樣抽出);CDN 快取 12 小時。© 2026 阿康(goodskang)
const FM = 'https://api.finmindtrade.com/api/v4/data?';
const SITE = 'https://stock.goodskang.tw';
const LIST = [["2330", "台積電"], ["0050", "元大台灣50"], ["00631L", "元大台灣50正2"], ["6781", "AES-KY"], ["3017", "奇鋐"], ["1717", "長興"], ["2303", "聯電"], ["2327", "國巨"], ["6278", "台表科"], ["4958", "臻鼎-KY"], ["3037", "欣興"], ["2409", "友達"], ["2360", "致茂"], ["6182", "合晶"], ["2408", "南亞科"], ["2883", "凱基金"], ["3227", "原相"], ["5246", "勵威"], ["7710", "東擎科技"], ["1303", "南亞"], ["2059", "川湖"], ["4513", "福裕"], ["6116", "彩晶"], ["6213", "聯茂"], ["6415", "矽力-KY"], ["8039", "台虹"], ["2221", "大甲"], ["2312", "金寶"], ["2472", "立隆電"], ["0052", "富邦科技"], ["6271", "同欣電"], ["6770", "力積電"], ["8046", "南電"], ["8150", "南茂"], ["1708", "東鹼"], ["1815", "富喬"], ["2308", "台達電"], ["2454", "聯發科"], ["2486", "一詮"], ["4526", "東台"], ["6173", "信昌電"], ["6672", "騰輝電子-KY"], ["6727", "亞泰金屬"], ["2345", "智邦"], ["2376", "技嘉"], ["2382", "廣達"], ["2383", "台光電"], ["3008", "大立光"], ["3010", "華立"], ["3167", "大量"], ["3231", "緯創"], ["3441", "聯一光"], ["3479", "安勤"], ["3481", "群創"], ["5425", "台半"], ["6438", "迅得"], ["7772", "耀穎"], ["8210", "勤誠"], ["8227", "巨有科技"], ["1785", "光洋科"], ["2340", "台亞"], ["2344", "華邦電"], ["2388", "威盛"], ["2466", "冠西電"], ["2481", "強茂"], ["2489", "瑞軒"], ["2492", "華新科"], ["2887", "台新新光金"], ["3030", "德律"], ["3211", "順達"], ["3669", "圓展"], ["4938", "和碩"], ["5388", "中磊"], ["0056", "元大高股息"], ["6187", "萬潤"], ["6207", "雷科"], ["6257", "矽格"], ["6274", "台燿"], ["6285", "啟碁"], ["6669", "緯穎"], ["8299", "群聯"], ["00878", "國泰永續高股息"], ["2317", "鴻海"], ["2412", "中華電"], ["2881", "富邦金"], ["2882", "國泰金"], ["2891", "中信金"], ["3711", "日月光投控"], ["2886", "兆豐金"], ["2884", "玉山金"], ["1216", "統一"], ["2002", "中鋼"], ["2357", "華碩"], ["2885", "元大金"], ["2892", "第一金"], ["5880", "合庫金"], ["2207", "和泰車"], ["1301", "台塑"], ["2603", "長榮"], ["2880", "華南金"], ["3034", "聯詠"], ["2395", "研華"], ["2912", "統一超"], ["6505", "台塑化"], ["3045", "台灣大"], ["2301", "光寶科"], ["2379", "瑞昱"], ["5871", "中租-KY"], ["2890", "永豐金"], ["1101", "台泥"], ["3661", "世芯-KY"], ["3533", "嘉澤"], ["2368", "金像電"], ["3653", "健策"], ["2449", "京元電子"], ["6488", "環球晶"], ["5274", "信驊"], ["3529", "力旺"], ["2618", "長榮航"], ["2609", "陽明"], ["2615", "萬海"], ["1513", "中興電"], ["1519", "華城"], ["1504", "東元"], ["6446", "藥華藥"], ["4743", "合一"], ["1795", "美時"], ["8069", "元太"], ["6147", "頎邦"], ["2049", "上銀"], ["3044", "健鼎"], ["2313", "華通"], ["2367", "燿華"], ["6239", "力成"], ["3189", "景碩"], ["8358", "金居"], ["3105", "穩懋"], ["2458", "義隆"], ["3016", "嘉晶"], ["006208", "富邦台50"], ["00692", "富邦公司治理"], ["00850", "元大臺灣ESG永續"], ["00919", "群益台灣精選高息"], ["00929", "復華台灣科技優息"], ["00713", "元大台灣高息低波"], ["00918", "大華優利高填息30"], ["00940", "元大台灣價值高息"], ["00646", "元大S&P500"], ["00662", "富邦NASDAQ"], ["00679B", "元大美債20年"], ["00687B", "國泰20年美債"], ["00937B", "群益ESG投等債20+"], ["00881", "國泰台灣科技龍頭"], ["00981A", "主動統一台股增長"], ["00685L", "群益臺灣加權正2"], ["00632R", "元大台灣50反1"]];
const IDS = LIST.map(x => x[0]);
const NAME = Object.fromEntries(LIST);
let window = {};
const fmt = (n, d = 2) => Number(n).toLocaleString('zh-TW', {minimumFractionDigits: d, maximumFractionDigits: d});
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const ymd = d => d.toISOString().slice(0, 10);
async function get(ds, id, start, end){
  for(let a = 0; a < 2; a++){
    try{ const q = {dataset: ds, data_id: id}; if(start) q.start_date = start; if(end) q.end_date = end;
      const j = await (await fetch(FM + new URLSearchParams(q))).json(); if(j.status === 200) return j.data || []; }catch(e){}
    await new Promise(r => setTimeout(r, 700));
  }
  return null;
}
function taChecklist(s, instNet){
  const n = s.length; if(n < 65) return null;
  const c = s.map(d => d.close);
  const ma = (k, idx) => { let t = 0; for(let j = idx-k+1; j <= idx; j++) t += c[j]; return t / k; };
  const i = n - 1, last = s[i], prev = s[i-1];
  const ma5 = ma(5, i), ma10 = ma(10, i), ma20 = ma(20, i), ma20p = ma(20, i-3);
  // 波段級轉折:ZigZag 反轉門檻(依股性自適應:1.8×平均日振幅,夾在 3%~9%)
  // 小於門檻的三兩天小抖動不算頭腳——朱家泓畫的頭與底是「波段」,不是雜訊
  let ampSum = 0;
  for(let k = n - 20; k < n; k++) ampSum += (s[k].max - s[k].min) / c[k - 1];
  const TH = Math.min(0.065, Math.max(0.025, (ampSum / 20) * 1.2));   // 高波動股門檻壓在 6.5% 內,否則整段打底結構會被當雜訊抹掉
  const pv = [];
  let pend = null;   // 進行中的未完成波:漲/跌了一段但尚未反轉確認——不計入它,引擎會拿兩個月前的舊頭腳看今天
  {
    let hiV = c[0], hiI = 0, loV = c[0], loI = 0, dir = 0;
    for(let k = 1; k < n; k++){
      if(c[k] > hiV){ hiV = c[k]; hiI = k; }
      if(c[k] < loV){ loV = c[k]; loI = k; }
      if(dir <= 0 && c[k] >= loV * (1 + TH)){
        pv.push({t: 'L', p: loV, i: loI});
        dir = 1; hiV = c[k]; hiI = k;
      } else if(dir >= 0 && c[k] <= hiV * (1 - TH)){
        pv.push({t: 'H', p: hiV, i: hiI});
        dir = -1; loV = c[k]; loI = k;
      }
    }
    if(dir === 1) pend = {t: 'H', p: hiV, i: hiI};
    else if(dir === -1) pend = {t: 'L', p: loV, i: loI};
  }
  const pvAll = pend ? pv.concat([pend]) : pv;
  // 趨勢判定用「含進行波」的結構;頸線與防守用「已確認」的轉折
  const Hs = pvAll.filter(p => p.t === 'H').slice(-2), Ls = pvAll.filter(p => p.t === 'L').slice(-2);
  const HsC = pv.filter(p => p.t === 'H').slice(-2), LsC = pv.filter(p => p.t === 'L').slice(-2);
  let trend = '盤整';
  if(Hs.length === 2 && Ls.length === 2){
    if(Hs[1].p > Hs[0].p && Ls[1].p > Ls[0].p) trend = '多頭';
    else if(Hs[1].p < Hs[0].p && Ls[1].p < Ls[0].p) trend = '空頭';
  }
  // 突破確立:現價已站過「所有近期確認頭」超過一個反轉門檻的幅度+月線上彎——突破不是今天的事,是已完成的事實
  const neckTop = HsC.length ? Math.max(...HsC.map(h => h.p)) : 0;
  let sustained = false;
  if(trend !== '多頭' && neckTop > 0 && last.close > neckTop * (1 + TH) && last.close > ma20 && ma20 > ma20p){
    trend = '多頭'; sustained = true;
  }
  // 一致性覆寫:結構還掛「空頭」但價格已站回上彎月線=舊空頭頭腳已被市場否定,降級為盤整(後面可再觸發轉多/打底判定)
  if(trend === '空頭' && last.close > ma20 && ma20 > ma20p) trend = '盤整';
  // 量能先算(趨勢升級要用):今量相對前五日均量
  const vols = s.map(d => d.Trading_Volume || 0);
  const v5 = (vols[i-1] + vols[i-2] + vols[i-3] + vols[i-4] + vols[i-5]) / 5;
  const volX = v5 > 0 ? vols[i] / v5 : 0;
  // 漲停判定:收盤漲幅 ≥9.45% 視為亮燈——漲停鎖死的量縮是「惜售」不是弱,規則要另眼看待
  const limitUp = last.close >= prev.close * 1.0945;
  // 盤整/空頭末端「帶量突破頸線」=轉多確認(頸線=最近一個反彈高點,即最近的「頭」);漲停鎖死視同帶量
  const ma20now = ma(20, i);
  const neck = HsC.length ? HsC[HsC.length-1].p : Math.max(...c.slice(Math.max(0, n - 41), n - 1));
  let breakout = false;
  if(trend !== '多頭' && last.close > neck && last.close > ma20now && (volX >= 1.3 || limitUp)){ trend = '轉多'; breakout = true; }
  const items = [];
  // 「攻到頸線門口」:差 2% 以內+有攻擊力(帶量或漲停),點名關鍵價,別讓使用者以為工具沒看見
  const nearNeck = trend === '盤整' && last.close > ma20now && neck > last.close
    && (neck - last.close) / neck <= 0.02 && (volX >= 1.3 || limitUp);
  // 盤整再分層:底底高但未過前頭=「打底轉強」;頭頭低但未破前底=「作頭疑慮」——過渡期,不是死魚盤
  let phase = '';
  if(trend === '盤整' && Hs.length === 2 && Ls.length === 2){
    if(Ls[1].p > Ls[0].p && Hs[1].p <= Hs[0].p) phase = '打底';
    else if(Hs[1].p < Hs[0].p && Ls[1].p >= Ls[0].p) phase = '作頭';
  }
  // ① 趨勢:頭與底定義,不用感覺;帶量/漲停突破頸線視為轉多確認
  items.push({icon: (trend === '多頭' || trend === '轉多') ? '✅' : trend === '空頭' ? '❌' : '⚠️', name: '趨勢(頭與底)',
    txt: trend === '多頭' ? (sustained
         ? `已突破前波頭 ${fmt(neckTop)} 並續漲 ${((last.close / neckTop - 1) * 100).toFixed(0)}%——多頭結構確立,原頸線轉為支撐`
         : '頭頭高、底底高——多頭結構')
       : trend === '轉多' ? `${limitUp ? '漲停' : '帶量'}突破頸線(前波頭 ${fmt(neck)})——轉多確認(頭底雖交錯,但價量已先表態)`
       : trend === '空頭' ? '頭頭低、底底低——空頭結構,順勢原則下不做多'
       : nearNeck ? `${phase === '打底' ? '底底高已成立,' : ''}今天${limitUp ? '漲停' : '帶量'}攻到頸線門口——收 ${fmt(last.close)} vs 前波頭 ${fmt(neck)},只差 ${((neck - last.close) / neck * 100).toFixed(1)}%;收盤站過它才算轉多確認,<b>明天就是關鍵日</b>`
       : (trend === '盤整' && neckTop > 0 && last.close > neckTop) ? `頭底交錯,但已站上前波頭 ${fmt(neckTop)}(距「突破確立」門檻僅一步)——守住它不破,趨勢翻多在望;跌回其下=假突破,先退`
       : phase === '打底' ? `<b>打底轉強中</b>:底底高已成立(第二隻腳 ${fmt(Ls[1].p)} 高於前底 ${fmt(Ls[0].p)}),但還沒過前波頭 ${fmt(neck)}——非空非多的過渡期;收盤站過 ${fmt(neck)} =多頭確認,跌破 ${fmt(Ls[1].p)} =打底失敗`
       : phase === '作頭' ? `<b>作頭疑慮</b>:頭頭低已出現(${fmt(Hs[1].p)} 低於前頭 ${fmt(Hs[0].p)}),但前底 ${fmt(Ls[1].p)} 未破——跌破它轉空頭,收復 ${fmt(Hs[1].p)} 解除警報`
       : '頭底交錯——盤整,方向未表態'});
  // ② 均線架構:月線定多空,季線(60MA)定長線壓力——月線上但季線壓頭=反彈行情,不是回升趨勢
  const upSlope = ma20 > ma20p, above = last.close > ma20, bull = ma5 > ma10 && ma10 > ma20;
  const ma60v = ma(60, i), belowQ = last.close < ma60v;
  items.push({icon: (above && upSlope) ? (belowQ ? '⚠️' : '✅') : (!above && !upSlope) ? '❌' : '⚠️', name: '均線架構',
    txt: `${above ? '站上' : '跌破'}月線(${fmt(ma20)})、月線${upSlope ? '上彎' : '下彎'}${bull ? '、5>10>20 多頭排列' : ''}${(!above && !upSlope) ? '——空方環境' : ''}`
      + (belowQ ? `;但仍壓在季線(${fmt(ma60v)})之下——上方是長線套牢區,漲到季線前都算逆風反彈` : (last.close > ma60v && above ? ';季線之上,長線結構無壓' : ''))});
  // ③ 量價:相對五日均量的倍數(volX 已於趨勢段先算)
  const upDay = last.close > prev.close;
  let vIcon, vTxt;
  if(limitUp && volX < 1){ vIcon = '✅'; vTxt = `漲停鎖死+量縮(${volX.toFixed(1)}×)——惜售,想買的人買不到才沒量,籌碼強勢`; }
  else if(limitUp && volX >= 2){ vIcon = '⚠️'; vTxt = `漲停但爆大量(${volX.toFixed(1)}×)——高檔換手劇烈,留意隔日沖出貨劇本`; }
  else if(limitUp){ vIcon = '✅'; vTxt = `收漲停(量 ${volX.toFixed(1)}× 五日均量)——多方鎖盤`; }
  else if(upDay && volX >= 1.3){ vIcon = '✅'; vTxt = `上漲帶量(${volX.toFixed(1)}× 五日均量)——健康`; }
  else if(!upDay && volX < 1){ vIcon = '✅'; vTxt = `回檔量縮(${volX.toFixed(1)}×)——賣壓不重,健康`; }
  else if(!upDay && volX >= 1.3){ vIcon = '❌'; vTxt = `價跌量增(${volX.toFixed(1)}×)——真實賣壓`; }
  else if(upDay && volX < 0.9){ vIcon = '⚠️'; vTxt = `價漲量縮(${volX.toFixed(1)}× 五日均量)——追價意願不足,這種漲要打點折看`; }
  else if(upDay){ vIcon = '⚠️'; vTxt = `價漲量平(${volX.toFixed(1)}× 五日均量)——量能中性,放大到 1.3 倍以上才算買盤表態`; }
  else { vIcon = '⚠️'; vTxt = `量能平平(${volX.toFixed(1)}× 五日均量)`; }
  const hi20 = Math.max(...c.slice(-20));
  const body = Math.abs(last.close - last.open), upSh = last.max - Math.max(last.close, last.open);
  if(last.close >= hi20 * 0.97 && volX >= 2 && upSh > body){ vIcon = '❌'; vTxt += ';且高檔爆量收長上影——出貨警訊'; }
  // 盤中:把數字直接攤開講(目前多少張、均量多少張、收盤推估多少張),不要只給倍數讓人猜
  if(last.live){
    const lots = v => Math.round(v / 1000).toLocaleString('zh-TW');
    const nowLots = last.rawVol > 0 ? lots(last.rawVol) : '—';
    const projLots = lots(last.Trading_Volume), avgLots = lots(v5);
    if(last.fixed){
      // 13:30 之後:量價已是全日定案數字,判定是「確定」不是「推估」
      const head = `✅ <b>今日已收盤(13:30 定價 ${fmt(last.close)})</b>:全日成交 <b>${nowLots} 張</b>|5 日均量 <b>${avgLots} 張</b>|<b>${volX.toFixed(1)} 倍均量</b>——數字已定案,非推估`;
      let tail;
      if(last.fixed === 1){
        tail = `<br>🕐 <b>現在是盤後定價時段(14:00–14:30 以收盤價撮合)</b>——上面的量價判定用的就是最終數字,定價單參考的是同一個收盤價`;
      }else if(last.afFix > 0 || last.afOdd > 0){
        // 做功課模式:盤中+盤後定價+零股=全日真量(倍數判定仍用盤中量,和 5 日均量同一基準才公平)
        const af = last.afFix || 0, ao = last.afOdd || 0, tot = last.rawVol + af + ao;
        tail = `<br>🌙 <b>做功課版全日真量</b>:盤中 ${lots(last.rawVol)} 張+盤後定價 ${lots(af)} 張+零股 ${ao >= 1000 ? lots(ao) + ' 張' : ao.toLocaleString('zh-TW') + ' 股'}=<b>${lots(tot)} 張</b>(上方倍數以盤中量對 5 日均量計算,基準一致)`;
      }else{
        tail = `<br>🌙 收盤定案版——適合今晚做功課、明早開盤前對照(盤後定價/零股量約 14:30 後併入)`;
      }
      vTxt = `${head}<br>👉 ${vTxt}${tail}`;
    }else{
      const head = `⏳ <b>尚未收盤(${last.atTime || '盤中'})</b>:目前累積成交 <b>${nowLots} 張</b>|5 日均量 <b>${avgLots} 張</b>|照這個速度收盤約 <b>${projLots} 張(${volX.toFixed(1)} 倍均量)</b>`;
      if(last.elapsed && last.elapsed < 90){
        vIcon = '⚠️';
        vTxt = head + `<br>👉 開盤未滿 90 分鐘,推估會大幅跳動,<b>先看數字就好,10:30 後再判讀量價</b>`;
      }else{
        vTxt = head + `<br>👉 ${vTxt}(收盤才算數)`;
      }
    }
  }
  // 🚀 創新高帶量(首日):110 檔 ETF 成分股 × 3 年實測最有優勢的樣態——20 日內漲逾 10% 機率約 47%(一般日 36%)、典型漲幅約兩倍
  // 定義:收盤首次突破前 40 日最高價,且量 ≥ 5 日均量 1.3 倍
  let nh40 = false;
  if(n >= 45){
    let h40 = 0, h40p = 0;
    for(let k2 = n - 41; k2 <= n - 2; k2++) h40 = Math.max(h40, s[k2].max);
    for(let k2 = n - 42; k2 <= n - 3; k2++) h40p = Math.max(h40p, s[k2].max);
    nh40 = last.close > h40 && c[n - 2] <= h40p && volX >= 1.3;
  }
  if(nh40){
    if(vIcon !== '❌') vIcon = '✅';
    vTxt += `<br>🚀 <b>帶量突破 40 日新高(首日)</b>——本工具實測(110 檔 ETF 成分股×3 年):此樣態後 20 日內曾漲逾 10% 的機率約 47%、一般日約 36%,典型漲幅約為一般日的兩倍;<b>但突破失敗時跌得也快,防守紀律照舊、不可省</b>${(last.live && !last.fixed) ? '(盤中量為推估,收盤確認突破才算成立)' : ''}`;
  }
  items.push({icon: vIcon, name: '量價', txt: vTxt});
  // ⑤ 法人籌碼:外資+投信近 5 日合計——漲勢有沒有法人真金白銀,決定續航力;法人賣、行情漲=別人在拉,隔日沖劇本警戒
  if(instNet != null){
    const lots = Math.round(instNet / 1000);
    const v5sum = vols.slice(-5).reduce((a, b) => a + b, 0);
    const ratio = v5sum > 0 ? Math.abs(instNet) / v5sum * 100 : 0;
    let iIcon, iTxt;
    if(instNet > 0 && ratio >= 2){ iIcon = '✅'; iTxt = `外資+投信近 5 日合計<b class="up">買超 ${lots.toLocaleString('zh-TW')} 張</b>(佔 5 日量 ${ratio.toFixed(1)}%)——法人真金白銀進駐,行情有大人撐腰`; }
    else if(instNet < 0 && ratio >= 2){ iIcon = '❌'; iTxt = `外資+投信近 5 日合計<b class="down">賣超 ${Math.abs(lots).toLocaleString('zh-TW')} 張</b>(佔 5 日量 ${ratio.toFixed(1)}%)——${upDay ? '法人在出、行情在漲=拉抬另有其人,留意隔日沖/出貨劇本' : '法人持續調節,反彈先當反彈看'}`; }
    else { iIcon = '⚠️'; iTxt = `外資+投信近 5 日約略中性(${lots >= 0 ? '+' : ''}${lots.toLocaleString('zh-TW')} 張)——法人觀望,行情由內資與散戶推動,續航力要打個問號`; }
    items.push({icon: iIcon, name: '法人籌碼', txt: iTxt});
  }
  // ④ 買點紀律:回後買上漲,不追突破長紅
  const nearMA = Math.min(...s.slice(-5).map(d => d.min)) <= ma20 * 1.015;
  const redUp = last.close > last.open && upDay;
  // 「回後買上漲」只算一次,燈號與進場劇本共用——之前劇本少檢查「站上月線」,欣興 10/19 燈號未成立、劇本卻寫已成立
  // 另加「離月線 5% 內」:台郡 10/19 五日噴 +29%、乖離 +24.6%,只因 5 天前的低點碰過月線就被判「回後買上漲成立」——那是追高,不是回後買
  const buyOK = trend === '多頭' && above && nearMA && redUp && last.close < ma20 * 1.05;
  let bIcon, bTxt;
  if(trend === '空頭'){ bIcon = '❌'; bTxt = '空頭結構沒有「回後買上漲」——反彈走的是「彈後空下跌」的劇本'; }
  else if(trend === '轉多'){ bIcon = '⚠️'; bTxt = '轉多確認日通常已是長紅——順勢紀律不追突破當天,等回測頸線(前高)不破後的第一根上漲紅K再說'; }
  else if(buyOK){ bIcon = '✅'; bTxt = '近日回測月線不破+今日收紅上漲——「回後買上漲」樣態成立。<span style="color:var(--muted);">誠實註記:本工具實測(109 檔×3 年)此樣態報酬與一般日相當,它的價值在防守近、賠得少,不在漲得多</span>'; }
  else if(trend === '多頭' && last.close > ma20 * 1.08){ bIcon = '⚠️'; bTxt = `乖離月線已 ${((last.close / ma20 - 1) * 100).toFixed(1)}%,此刻進場屬於追高——順勢紀律是等回測支撐不破後的第一根上漲紅K`; }
  else { bIcon = '⚠️'; bTxt = '「回後買上漲」條件未成立——不追突破長紅,等回測支撐後的第一根上漲紅K'; }
  items.push({icon: bIcon, name: '買點紀律', txt: bTxt});
  // ⚡ 變盤線預告(手冊規則:低檔十字/長下影→次日開高確認)——前一晚就看得到的攻擊前兆
  {
    const rng2 = last.max - last.min, body2 = Math.abs(last.close - last.open);
    const lowSh = Math.min(last.close, last.open) - last.min;
    const supLow = LsC.length ? LsC[LsC.length - 1].p : 0;
    const nearSup = (Math.abs(last.min - ma20) / ma20 <= 0.02) || (supLow > 0 && Math.abs(last.min - supLow) / supLow <= 0.02);
    const min9 = Math.min(...s.slice(-10, -1).map(b => b.min));
    const newLow10 = last.min <= min9 * 1.002;   // 創近 10 日新低卻收出下影=止跌試探(空頭末端最值錢的訊號)
    if(!limitUp && rng2 > 0 && (nearSup || newLow10) && (body2 <= rng2 * 0.35 || lowSh >= body2 * 2)){
      items[items.length - 1].txt += `;⚡ <b>變盤線預告:</b>今日在${nearSup ? '支撐區' : '低檔試探後'}收出十字/長下影(低點 ${fmt(last.min)})——<b>明天開高並站過今日高點 ${fmt(last.max)} =變盤確認</b>,這是攻擊發起的前一晚長相;明天開低則變盤失敗,不追`;
    }
  }
  const score = items.filter(x => x.icon === '✅').length;
  const lastLowC = LsC.length ? LsC[LsC.length-1].p : Math.min(...c.slice(-20));
  // 防守要「近而有效」:站上前波頭→前高轉支撐;多頭延伸段→再升級成「移動防守」
  let lastLow = (neckTop > 0 && last.close > neckTop && neckTop > lastLowC) ? neckTop : lastLowC;
  // 移動防守(手冊規則:獲利後用「前一個底」或月線移動停利)——找最近一個 ±2 根的小回檔低點
  let trailLow = 0;
  for(let k = n - 3; k >= Math.max(2, n - 16); k--){
    const lo0 = s[k].min;
    if(lo0 <= s[k-1].min && lo0 <= s[k-2].min && lo0 <= s[k+1].min && (k + 2 >= n || lo0 <= s[k+2].min)){ trailLow = lo0; break; }
  }
  let trailing = false, farNote = '', splitStop = false;
  // 🪓 分割感知:分割後是全新籌碼世界——「還原價」市場沒真正成交過,支撐記憶只存在於實際交易過的價位
  // 防守升級成「分割後最低點」:跌破它=分割後所有買進者全數套牢,轉空確認
  const splitD = window.__splitDate || '';
  if(splitD){
    const ps = s.filter(d2 => d2.date >= splitD);
    if(ps.length >= 6){
      const psLow = Math.min(...ps.slice(0, -1).map(d2 => d2.min));
      if(psLow > lastLow && psLow < last.close){ lastLow = psLow; splitStop = true; }
    }
  }
  if(trend === '多頭'){
    const cand = [trailLow, ma20, lastLow].filter(v => v > 0 && v < last.close);
    if(cand.length){ const up2 = Math.max(...cand); if(up2 > lastLow){ lastLow = up2; trailing = true; } }
  }
  // ⬇ 遠底防呆是「所有趨勢」都要過的第二道關卡——多頭標籤的股票急跌時(欣興案例)一樣會抱著遠底不放
  if(lastLow > 0 && lastLow < last.close * 0.88){
    // 🛡 遠底防呆:前波確認底距現價 >12%,拿它當防守=實質不設防(分割股、急漲急跌股常見)
    // 不論趨勢標籤,改用「近期回檔低點/月線/近10日低點」中低於現價的較高者當實務防守
    // (陰跌盤沒有標準 ±2 微底、月線又在頭上時,近10日低點是最後的保底候選)
    const r10 = s.length >= 12 ? Math.min(...s.slice(-11, -1).map(b2 => b2.min)) : 0;
    // 🔎 次級回檔底:波段 ZigZag 門檻(最高 6.5%)會把「上漲中途 -6% 的回檔」當雜訊,但那個回檔低點(聯電 9/25 的 139)正是多頭最後一個墊高的底——
    // 現價跌破近 10 日低點時,先找近 60 日內「±3 根局部低點、在現價之下、距現價 ≤12%」最近的一個,有就是實務防守,不能直接判「破底、無防守」
    // 轉折用「收盤」找(±3 根收盤最低那天),防守用那根 K 的最低價——聯電 9/15 收 138.5 是起漲前的回檔底,防守 138
    let minorLow = 0;
    for(let k = n - 4; k >= Math.max(3, n - 60); k--){
      const lo0 = s[k].min; if(!(lo0 < last.close * 0.995 && lo0 >= last.close * 0.88)) continue;
      let ok = true; for(let j = k - 3; j <= k + 3; j++){ if(j === k || j < 0 || j >= n) continue; if(c[j] < c[k]){ ok = false; break; } }
      if(ok){ minorLow = lo0; break; }
    }
    const cand = [trailLow, ma20, r10, minorLow].filter(v => v > 0 && v < last.close);
    if(cand.length){
      const up2 = Math.max(...cand);
      if(up2 > lastLow){ farNote = `;結構上的前波底 ${fmt(lastLow)} 距現價超過 12%,拿它當防守形同不設防——改用實務防守`; lastLow = up2; trailing = true; }
    }else{
      // 近期低點全在現價之上=正在破底——不硬給假防守,直接把危險講明白
      farNote = 'BREAK';
    }
  }
  const recentLow = Math.min(...s.slice(-6, -1).map(b => b.min));
  const shortNote = (trend !== '空頭' && recentLow > lastLow * 1.02) ? `;短線想守緊一點,可用近日回檔低點 ${fmt(recentLow)}` : '';
  // 🌊 振幅檢核:防守距離小於「近10日平均日振幅×0.8」=雜訊地板之下——盤中正常晃動就會掃到,不是真防守
  // 觸發時提供「退一層」的波段防守(次一個結構支撐,優先挑距離足夠的)
  let amp10 = 0;
  { let a2 = 0, k3 = 0; for(let j3 = Math.max(1, n - 10); j3 < n; j3++){ if(s[j3].close > 0){ a2 += (s[j3].max - s[j3].min) / s[j3].close; k3++; } } if(k3) amp10 = a2 / k3 * 100; }
  const distPct = (last.close > 0 && lastLow > 0) ? (last.close - lastLow) / last.close * 100 : 0;
  // ⛔ 已跌破防守:防守價在現價之上(南亞科 497 vs 432.75)——不能再當「多方防守位」推薦,也不能拿負數距離去跟振幅比
  const brokeStop = farNote !== 'BREAK' && lastLow > 0 && last.close < lastLow;
  let altStop = 0, ampNote = '';
  if(!brokeStop && farNote !== 'BREAK' && lastLow > 0 && amp10 > 0 && distPct > 0 && distPct < amp10 * 0.8){
    const lower = [trailLow, ma20, lastLowC].filter(x2 => x2 > 0 && x2 < lastLow * 0.999).sort((a3, b3) => b3 - a3);
    altStop = lower.find(x2 => (last.close - x2) / last.close * 100 >= amp10 * 0.8) || (lower.length ? lower[lower.length - 1] : 0);
    ampNote = `;🌊 <b>注意:防守距現價僅 ${distPct.toFixed(1)}%,小於近10日平均日振幅 ${amp10.toFixed(1)}%</b>——盤中正常晃動就可能掃到,這個距離只適合當沖的緊出場;<b>波段操作請退一層</b>${altStop ? `用 <b>${fmt(altStop)}</b>(距 ${((last.close - altStop) / last.close * 100).toFixed(1)}%)當防守,部位跟著縮` : ',或等拉回更貼近支撐再進場'}`;
  }
  const stop = brokeStop
    ? `⚠️ <b>現價 ${fmt(last.close)} 已跌破防守 ${fmt(lastLow)}</b>(-${((lastLow - last.close) / lastLow * 100).toFixed(1)}%)——買進依據已失效:<b>持有者照停損紀律處理</b>(不攤平、不把停損往下移);未持有者等<b>收復 ${fmt(lastLow)}</b> 或出現新的底再評估`
    : farNote === 'BREAK'
    ? `⚠️ <b>現價 ${fmt(last.close)} 已跌破近期所有低點</b>(近10日低、微回檔底都在現價之上)——正在破底,近距離沒有任何支撐;下一個結構支撐遠在 <b>${fmt(lastLow)}</b>(約 -${((last.close - lastLow) / last.close * 100).toFixed(0)}%)。這種位置做多形同沒有防守——順勢規則的答案:空手不進場,持有者依自己的停損紀律處理,不凹單`
    : trailing
    ? `${farNote ? '實務' : '多頭移動'}防守=前一個回檔底/月線之較高者 ${fmt(lastLow)}(月線 ${fmt(ma20)})——${farNote ? farNote.slice(1) : '趨勢延伸,防守跟著墊高'};跌破就出場或大減碼,停利可以提早、停損不能商量${shortNote}`
    : splitStop
    ? `分割後結構防守=<b>分割後最低點 ${fmt(lastLow)}</b>——分割前的還原價位市場沒有真正成交過,參考性低;分割後才是這檔的新籌碼世界,跌破分割後低點=分割後買進的人全數套牢,轉空確認、無條件出場${shortNote}`
    : (lastLow === neckTop && neckTop > lastLowC)
    ? `多方防守=前高轉支撐 ${fmt(neckTop)} 與月線 ${fmt(ma20)}——突破後回測不破=突破有效的二次確認;跌破就出場,不攤平${shortNote}`
    : `多方常用防守位=前波低點 ${fmt(lastLow)} 與月線 ${fmt(ma20)}——順勢規則:跌破買進依據的低點就無條件出場、不攤平、不延後${shortNote}`;
  const nItems = items.length, thF = nItems - 1, thL = nItems - 2;   // 友善=只差一燈,偏多=差兩燈(相容 4 燈與 5 燈版)
  const instBad = instNet != null && instNet < 0;
  const verdict = trend === '空頭'
    ? `🚦 綜合:日K環境對「做多短線/當沖」<b class="down">不利</b>——順勢原則:當沖也只做日K趨勢的方向,空頭日不硬做多。`
    : score >= thF
    ? `🚦 綜合:日K環境對「做多短線/當沖」<b class="up">相對友善</b>(${score}/${nItems} 綠燈)——但短線成敗在盤中紀律,環境好不等於會賺。`
    : (trend === '多頭' && bIcon === '✅')
    ? `🚦 綜合:<b class="up">順勢買點浮現</b>(${score}/${nItems} 綠燈)——「回後買上漲」樣態成立,這是順勢框架裡<b>賠率結構最好</b>的進場位置(防守近、賠得少);但配套燈號未滿(留意季線壓力或法人動向),倉位打折、防守 <b>${fmt(lastLow)}</b> 嚴格執行,跌破不戀戰。`
    : (trend === '多頭' && score >= thL)
    ? `🚦 綜合:<b class="up">順勢偏多</b>(${score}/${nItems} 綠燈)——日K趨勢向上,但短線條件未齊——與其追高,不如等拉回支撐(${fmt(lastLow)} / 月線 ${fmt(ma20)})再接,順勢不追勢。`
    : (phase === '打底' && (score >= 1 || nearNeck))
    ? (limitUp
      ? `🚦 綜合:<b style="color:var(--gold);">打底期爆出漲停</b>(${score}/${nItems} 綠燈)——第二隻腳之後的攻擊發起樣態,頸線 <b>${fmt(neck)}</b> 就在前方:收盤站過=多頭確認${instBad ? ';但法人近 5 日在賣方,今天的漲停是內資拉的——<b>隔日沖賣壓警戒</b>,隔天開盤別接第一棒' : ',隔天留意能否守住漲停價不破'}。防守 <b>${fmt(lastLow)}</b>。`
      : `🚦 綜合:日K處於<b style="color:var(--gold);">打底轉強醞釀期</b>(${score}/${nItems} 綠燈)——還不到全面做多,但已不是死盤。短線只宜輕倉試單,鎖住兩個價位:收盤站過頸線 <b>${fmt(neck)}</b> 環境升級,跌破 <b>${fmt(lastLow)}</b> 無條件走人。`)
    : phase === '作頭'
    ? `🚦 綜合:日K出現<b class="down">作頭疑慮</b>(${score}/${nItems} 綠燈)——反彈不追,短線做多先縮手;跌破 <b>${fmt(lastLow)}</b> 轉空確認。`
    : `🚦 綜合:日K環境<b style="color:var(--gold);">中性</b>(${score}/${nItems} 綠燈)——訊號不齊,短線寧可少做,等綠燈變多。`;
  // 🎯 進場劇本:順勢規則的觸發條件與對應價位——把「什麼情況下才有進場理由」寫成可核對的條件
  // (條件描述、非指示;跟防守參考同一個哲學:價位是算出來的,決定是你的)
  let entry = '';
  const dMa = ma20 > 0 ? (last.close - ma20) / ma20 * 100 : 0;
  if(farNote === 'BREAK' || trend === '空頭'){
    entry = `空方環境沒有做多劇本——翻多的第一個條件:<b>收盤站回月線 ${fmt(ma20)} 且月線轉平上彎</b>;在那之前順勢規則的答案是空手等,搶反彈是逆勢行為,要做也是最小部位、最緊出場`;
  }else if(trend === '轉多'){
    entry = `轉多確認日通常已是長紅,順勢紀律<b>不追突破當天</b>——劇本:<b>回測頸線 ${fmt(neck)} 不破,出現第一根上漲紅K</b>(收盤>開盤且>昨收)才是規則裡的進場條件;跌回頸線之下=突破失敗,劇本作廢`;
  }else if(trend === '多頭'){
    if(buyOK) entry = `<b>「回後買上漲」條件今日已成立</b>——順勢框架的標準進場樣態就長這樣:防守 ${fmt(lastLow)} 就在腳邊,部位用下方計算器算,跌破就走、不攤平`;
    else if(!above) entry = `頭底結構仍是多頭,但<b>收盤已跌破月線 ${fmt(ma20)}</b>(${dMa.toFixed(1)}%)——短線轉弱。劇本:①<b>收盤站回月線且月線維持上彎</b>=回檔結束;②`
      + (brokeStop ? `前波低點 ${fmt(lastLow)} 也已跌破,結構待重建——等<b>新的底</b>(變盤線+次日開高)出現才是第二隻腳候選` : `在前波低點 <b>${fmt(lastLow)}</b> 附近出現變盤線+次日開高=第二隻腳候選`)
      + `。兩者都沒出現前,這是回檔中,不是「回後買上漲」`;
    else if(dMa >= 5) entry = `現價乖離月線已 <b>+${dMa.toFixed(1)}%</b>,此刻進場=追高——劇本A <b>拉回接</b>:回測月線 ${fmt(ma20)} 附近止跌收紅再核對;劇本B <b>動能續航</b>:收盤帶量(≥1.3×均量)創近 40 日新高${nh40 ? '(<b>今日已觸發 🚀</b>)' : ''}視為趨勢延續。兩個條件都沒出現就等——<b>錯過不是錯,追高被洗才是</b>`;
    else entry = `多頭延伸、乖離不大——兩個標準觸發條件:①<b>拉回月線 ${fmt(ma20)} 附近不破+收紅上漲</b>(回後買上漲);②<b>收盤帶量創近 40 日新高</b>(🚀 動能訊號,本工具實測樣態)。沒觸發就觀察,順勢者不需要天天出手`;
  }else if(phase === '打底'){
    entry = `打底過渡期只有一個劇本:<b>收盤帶量站上頸線 ${fmt(neck)}</b>(距現價 ${last.close < neck ? '+' + ((neck - last.close) / last.close * 100).toFixed(1) + '%' : '已在門口'})=多頭確認,那之前進場都是在賭它會過;跌破第二隻腳=打底失敗、劇本作廢`;
  }else if(phase === '作頭'){
    entry = `作頭疑慮中沒有做多劇本——<b>收復前頭 ${Hs.length >= 2 ? fmt(Hs[1].p) : fmt(neck)}</b> 解除警報之前,現金也是一種部位;真要接,等跌破轉空或收復解除,二選一明朗再說`;
  }else{
    entry = `盤整區間,順勢者的劇本:<b>收盤帶量突破前波頭 ${fmt(neck)}</b>(距現價 ${last.close < neck ? '+' + ((neck - last.close) / last.close * 100).toFixed(1) + '%' : '門口'})才有進場理由;區間裡殺進殺出,多數時候是幫券商打工`;
  }
  // 🎯 規則化價位與動作標籤(演算法依當下數據輸出,非人為買賣建議)
  let sig = null;
  try{
    const px = last.close, broke = brokeStop || farNote === 'BREAK';
    // 台股升降單位:價位一律對齊實際可掛單的 tick(停損往下取、停利往下取)
    const tick = p => p < 10 ? 0.01 : p < 50 ? 0.05 : p < 100 ? 0.1 : p < 500 ? 0.5 : p < 1000 ? 1 : 5;
    const tDn = p => { const k = tick(p); return Math.floor(p / k + 1e-9) * k; };
    // 停損距離至少要 ≥ 近 10 日平均日振幅(最少 2%):太近的防守一個正常盤中晃動就掃掉,報酬風險比也會被灌水
    const minD = Math.max(2, amp10 || 0) / 100;
    // 追高門檻跟著股性走:日振幅大的股票,離月線 8% 是日常,不該一律用 5% 判追高(上限 10%)
    const chaseT = Math.min(10, Math.max(5, (amp10 || 0) * 2));
    // 🚀 動能突破:多頭/轉多+帶量創近 40 日新高+至少 3 燈——檢查表「劇本B 動能續航」成立,乖離大也算進場訊號(防守改用突破K低點/頸線)
    const momo = !broke && (trend === '多頭' || trend === '轉多') && nh40 && score >= 3 && dMa < 25;
    let stopP = broke ? 0 : (altStop > 0 ? altStop : lastLow), stopWhy = '收盤跌破即出場';
    if(momo){
      const cs = [last.min, neck, trailLow, ma20].filter(v => v > 0 && v < px * (1 - minD));
      stopP = cs.length ? Math.max(...cs) : px * (1 - minD * 1.5);
      stopWhy = '突破K低點/頸線/月線中最近的一個,跌破=突破失敗';
    }
    if(stopP > 0 && (px - stopP) / px < minD){
      const lower = [trailLow, ma20, lastLowC, ...LsC.map(p => p.p)].filter(v => v > 0 && v < px * (1 - minD)).sort((a3, b3) => b3 - a3);
      if(lower.length && (px - lower[0]) / px <= 0.12){ stopP = lower[0]; stopWhy = '近端防守太貼現價,退到下一個支撐'; }
      else { stopP = px * (1 - minD * 1.5); stopWhy = `近端防守太貼現價,改用波動停損(1.5×平均日振幅 ${(amp10 || 0).toFixed(1)}%)`; }
    }
    if(stopP > 0) stopP = tDn(stopP);
    const risk = stopP > 0 ? px - stopP : 0;
    // 停利參考①:現價之上最近的波段高點(上檔第一個套牢區);沒有就看近 120 日最高;再沒有(創新高)用 1:2 風險報酬推算
    const hAbove = pvAll.filter(p => p.t === 'H' && p.p > px * (1 + minD)).map(p => p.p);
    const hi120 = Math.max(...s.slice(Math.max(0, n - 120), n - 1).map(b => b.max));
    let tp1 = 0, tp1Why = '';
    if(hAbove.length){ tp1 = Math.min(...hAbove); tp1Why = '上方最近的波段高點(前波套牢區)'; }
    else if(hi120 > px * (1 + minD)){ tp1 = hi120; tp1Why = '近半年最高價'; }
    else if(risk > 0){ tp1 = px + risk * 2; tp1Why = '上方無前高,以「風險 ×2」推算'; }
    // 停利參考②:等幅測距——前一段上漲波的幅度,從最近的底往上量
    let tp2 = 0, tp2Why = '';
    {
      let hI = -1; for(let k = pvAll.length - 1; k >= 1; k--){ if(pvAll[k].t === 'H' && pvAll[k-1].t === 'L'){ hI = k; break; } }
      const baseL = LsC.length ? LsC[LsC.length - 1].p : 0;
      if(hI >= 1 && baseL > 0){
        const mm = baseL + (pvAll[hI].p - pvAll[hI-1].p);
        if(mm > Math.max(tp1, px) * 1.02){ tp2 = mm; tp2Why = `等幅測距:前一段上漲波 ${fmt(pvAll[hI-1].p)}→${fmt(pvAll[hI].p)} 的幅度,從最近的底 ${fmt(baseL)} 往上量`; }
      }
      if(!tp2 && risk > 0 && tp1 > 0){ const r3 = px + risk * 3; if(r3 > tp1 * 1.02){ tp2 = r3; tp2Why = '以「風險 ×3」推算'; } }
    }
    tp1 = tp1 > 0 ? tDn(tp1) : 0; tp2 = tp2 > 0 ? tDn(tp2) : 0;
    const lo = tDn(Math.max(stopP * 1.005, Math.min(px, ma20)));
    let tag, cls2, act, zone = '', zoneWhy = '', holdAct;
    if(broke){
      tag = '🔴 停損訊號'; cls2 = 'r';
      act = brokeStop ? `收盤 ${fmt(px)} 已跌破防守 ${fmt(lastLow)},原本的買進依據失效` : `收盤已跌破近期所有低點,近距離沒有支撐`;
      zone = ''; zoneWhy = brokeStop ? `收復 ${fmt(lastLow)} 或站回月線 ${fmt(ma20)} 才重新評估` : `收盤站回月線 ${fmt(ma20)} 且月線上彎才重新評估`;
      holdAct = '持有者:停損條件已觸發(不攤平、不把停損往下移)';
    }else if(trend === '空頭' || phase === '作頭'){
      tag = '🟠 減碼訊號'; cls2 = 'o';
      act = trend === '空頭' ? '頭頭低、底底低的空頭結構,做多不在順勢框架內' : '頭頭低的作頭結構,反彈先看壓力';
      zoneWhy = `收盤站回月線 ${fmt(ma20)} 且月線上彎才轉為可進場`;
      holdAct = `持有者:反彈到月線 ${fmt(ma20)} 附近是減碼參考;跌破 ${fmt(stopP)} 出場`;
    }else if(momo && risk > 0){
      tag = '🟢 突破進場(動能)'; cls2 = 'g';
      act = `帶量創近 40 日新高(${score}/${nItems} 綠燈)——動能型進場;乖離月線 +${dMa.toFixed(1)}%,部位減半`;
      zone = `${fmt(tDn(px * 0.98))} – ${fmt(tDn(px))}`; zoneWhy = '收盤價附近;隔天開高超過 3% 不追';
      holdAct = `持有者:續抱,停損上移到 ${fmt(stopP)}`;
    }else if((buyOK || verdict.includes('友善') || verdict.includes('買點浮現')) && dMa < chaseT && risk > 0){
      tag = '🟢 可進場區'; cls2 = 'g';
      act = buyOK ? '「回後買上漲」樣態成立,防守就在附近' : '趨勢與燈號條件多數成立';
      zone = `${fmt(tDn(lo))} – ${fmt(tDn(px))}`; zoneWhy = '月線(或防守)到現價之間';
      holdAct = `持有者:續抱,停損 ${fmt(stopP)}${tp1 ? `、到 ${fmt(tp1)} 附近可分批停利` : ''}`;
    }else{
      tag = '🟡 觀望・等條件'; cls2 = 'y';
      if(trend === '多頭' && dMa >= chaseT){ act = `乖離月線 +${dMa.toFixed(1)}%,現價進場等於追高`; zone = `${fmt(tDn(ma20))} – ${fmt(tDn(ma20 * 1.02))}`; zoneWhy = '拉回月線附近止跌收紅'; }
      else if(trend === '多頭' && !above){ act = '多頭結構但收盤跌破月線,回檔中'; zoneWhy = `收盤站回月線 ${fmt(ma20)} 才轉為可進場`; }
      else if(trend === '轉多'){ act = '剛突破頸線,突破當天不追'; zone = `${fmt(tDn(neck))} – ${fmt(tDn(neck * 1.02))}`; zoneWhy = '回測頸線不破、收紅上漲'; }
      else if(trend === '多頭'){ act = '多頭延伸,但買點條件未齊'; zone = `${fmt(tDn(ma20))} – ${fmt(tDn(Math.min(px, ma20 * 1.02)))}`; zoneWhy = '拉回月線不破+收紅'; }
      else { act = phase === '打底' ? '打底轉強中,還沒過頸線' : '盤整區間,方向未定'; zoneWhy = `收盤帶量站上 ${fmt(neck)}(${neck > px ? '+' + ((neck - px) / px * 100).toFixed(1) + '%' : '門口'})才轉為可進場`; }
      holdAct = `持有者:續抱,跌破 ${fmt(stopP)} 出場${tp1 ? `;到 ${fmt(tp1)} 附近可分批停利` : ''}`;
    }
    if(!broke && dMa >= 15) holdAct = `持有者:乖離月線 +${dMa.toFixed(1)}% 偏熱,可先分批停利;停損上移到 ${fmt(stopP)}`;
    const rr = (risk > 0 && tp1 > px) ? (tp1 - px) / risk : 0;
    sig = {tag, cls: cls2, act, zone, zoneWhy, holdAct, stopWhy, stop: stopP, stopPct: stopP > 0 ? (stopP - px) / px * 100 : 0,
      tp1: broke ? 0 : tp1, tp1Why, tp1Pct: tp1 > 0 ? (tp1 - px) / px * 100 : 0, tp2: broke ? 0 : tp2, tp2Why, tp2Pct: tp2 > 0 ? (tp2 - px) / px * 100 : 0, rr, px};
  }catch(e){ sig = null; }
  // 對外顯示的防守價統一用訊號卡的停損參考(已做最小距離與升降單位調整),避免膠囊/K 線/計畫卡出現兩個不同的防守數字
  const stopUse = (sig && sig.stop > 0) ? sig.stop : lastLow;
  return {stopUse, items, score, nItems, stop: stop + ampNote, entry, verdict, marks: pv.slice(-6), ma20, lastLow, closes: c, total: n, breakdown: farNote === 'BREAK', brokeStop, nh40, amp10, altStop, sig};
}
async function analyze(id){
  const now = new Date(), end = ymd(now);
  const st = new Date(now); st.setDate(st.getDate() - 160); const startL = ymd(st);
  const s35 = new Date(now); s35.setDate(s35.getDate() - 35); const start = ymd(s35);
  const [px, sp, dv, inst, info] = await Promise.all([get('TaiwanStockPrice', id, startL, end), get('TaiwanStockSplitPrice', id, startL, end),
    get('TaiwanStockDividendResult', id, startL, end), get('TaiwanStockInstitutionalInvestorsBuySell', id, start, end), get('TaiwanStockInfo', id)]);
  if(!px) return {err: 'upstream'};
  const s = px.filter(d => d.open > 0 && d.max > 0 && d.min > 0 && d.close > 0).sort((a, b) => a.date.localeCompare(b.date));
  const evs = [];
  for(const x of (sp || [])) if(x.before_price > 0 && x.after_price > 0) evs.push({date: x.date, factor: x.after_price / x.before_price});
  for(const x of (dv || [])) if(x.before_price > 0 && x.after_price > 0) evs.push({date: x.date, factor: x.after_price / x.before_price});
  window = {__splitDate: ''};
  const raw = s.length ? s[s.length - 1].close : 0, rawPrev = s.length > 1 ? s[s.length - 2].close : raw;
  for(const ev of evs){ for(const d of s){ if(d.date < ev.date){ d.close *= ev.factor; d.open *= ev.factor; d.max *= ev.factor; d.min *= ev.factor; if(ev.factor <= 0.5) d.Trading_Volume = Math.round((d.Trading_Volume || 0) / ev.factor); } } if(ev.factor <= 0.5) window.__splitDate = ev.date; }
  let instNet = null;
  if(Array.isArray(inst)){ const by = {}; for(const r of inst) if(r.name === 'Foreign_Investor' || r.name === 'Investment_Trust') by[r.date] = (by[r.date] || 0) + ((r.buy || 0) - (r.sell || 0));
    const ds = Object.keys(by).sort().slice(-5); if(ds.length >= 3) instNet = ds.reduce((a, d) => a + by[d], 0); }
  const nm = info && info[0] ? info[0].stock_name : '', ind = info && info[0] ? info[0].industry_category : '';
  let ck = null; try{ ck = taChecklist(s, instNet); }catch(e){}
  const n2 = s.length; const exDiv = (dv || []).some(x => s.length && x.date === s[n2 - 1].date);
  return {id, nm, ind, s, ck, raw, exDiv, chg: n2 > 1 && s[n2 - 2].close > 0 ? (s[n2 - 1].close - s[n2 - 2].close) / s[n2 - 2].close * 100 : 0, date: s.length ? s[s.length - 1].date : '', instNet};
}
const CSS = `body{margin:0;background:#000;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro TC","PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
.w{max-width:820px;margin:0 auto;padding:28px 18px 64px}a{color:#2997ff;text-decoration:none}h1{font-size:2rem;line-height:1.25;letter-spacing:-.01em;margin:8px 0 6px}h2{font-size:1.35rem;margin:36px 0 12px;letter-spacing:-.01em}
.crumb{font-size:.82rem;color:#86868b}.px{font-size:2.6rem;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.up{color:#ff453a}.down{color:#30d158}.muted{color:#86868b;font-size:.85rem}
.card{border-radius:22px;padding:20px;background:#1c1c1e;margin:14px 0}.tag{font-size:1.6rem;font-weight:700}
table{width:100%;border-collapse:collapse}td,th{padding:10px 6px;border-top:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:top}th{color:#86868b;font-weight:400;width:7.5em}
.cta{display:block;text-align:center;margin:22px 0;padding:15px;border-radius:14px;background:#2997ff;color:#fff;font-weight:600;font-size:1.02rem}
.disc{font-size:.78rem;color:#86868b;margin-top:22px}.links a{display:inline-block;margin:4px 6px 4px 0;padding:6px 12px;background:#1c1c1e;border-radius:999px;font-size:.86rem;color:#f5f5f7}
details{margin:10px 0;background:#1c1c1e;border-radius:16px;padding:12px 16px}summary{cursor:pointer;font-weight:600}details p{color:#c7c7cc;margin:8px 0 0}`;
const DISC = '此為根據目前數據參考顯示,非人為買賣建議,投資有賺有賠風險自負。';
function shell({title, desc, canon, body, ld}){
  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canon}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}"><meta property="og:type" content="article"><meta property="og:image" content="${SITE}/icon-512.png">
<meta name="robots" content="index,follow,max-snippet:-1"><link rel="icon" href="/icon-192.png"><style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0YWS8NKT6R"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-0YWS8NKT6R",{page_type:"stock_page"});</script></head><body><div class="w">${body}</div></body></html>`;
}
function linksHtml(cur){
  return '<p class="links">' + IDS.filter(x => x !== cur).slice(0, 40).map(x => `<a href="/stock/${x}">${esc(NAME[x] || '')} ${x}</a>`).join('') + ` <a href="/stock/">全部 →</a></p>`;
}
async function stockPage(id){
  const [r, etfM] = await Promise.all([analyze(id), /^00/.test(id) ? (async () => { try{ return await require('./etf.js').calcOne(id, ''); }catch(e){ return null; } })() : null]);
  if(r.err) return {statusCode: 503, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: '資料源忙線,請稍後重新整理'};
  if(!r.s.length || !r.ck) return {statusCode: 404, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600'}, body: shell({title: `${id} 查無足夠資料｜阿康的台股 AI 作戰室`, desc: '資料不足', canon: `${SITE}/stock/${id}`, ld: {}, body: `<h1>${esc(id)} 資料不足</h1><p>新上市或停牌股票,近期交易資料不足以分析。</p><a class="cta" href="/">回作戰室首頁</a>`})};
  const {nm, ck, raw, chg, date, ind} = r, g = ck.sig || {};
  const name = nm || id, isEtf = /^00/.test(id);
  const md = date.slice(5).replace('-', '/');
  const pc = v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  const rows = [];
  rows.push(['進場參考', g.zone ? `<b>${g.zone}</b>` : '<b>暫不進場</b>', esc(g.zoneWhy || '')]);
  if(g.stop > 0) rows.push(['停損參考', `<b class="down">${fmt(g.stop)}</b>(${pc(g.stopPct)})`, esc(g.stopWhy || '')]);
  if(g.tp1 > 0) rows.push([g.cls === 'o' ? '反彈壓力' : '停利參考①', `<b class="up">${fmt(g.tp1)}</b>(${pc(g.tp1Pct)})`, esc(g.tp1Why || '')]);
  if(g.tp2 > 0 && g.cls !== 'o') rows.push(['停利參考②', `<b class="up">${fmt(g.tp2)}</b>(${pc(g.tp2Pct)})`, esc(g.tp2Why || '')]);
  if(g.rr > 0 && g.zone) rows.push(['報酬風險比', `<b>${g.rr.toFixed(1)} : 1</b>`, '']);
  const tagPlain = strip(g.tag || ''), verdict = strip(ck.verdict).replace(/^🚦\s*綜合[::]?/, '');
  const faq = [
    [`${name}(${id})現在可以買嗎?`, `依 ${md} 收盤 ${fmt(raw)} 元的數據,訊號為「${tagPlain}」:${strip(g.act)}。${g.zone ? `進場參考區 ${g.zone}。` : strip(g.zoneWhy) + '。'}${DISC}`],
    [`${name}停損價設多少?`, g.stop > 0 ? `停損參考 ${fmt(g.stop)} 元(距現價 ${pc(g.stopPct)}),${strip(g.stopWhy)}。${strip(g.holdAct)}。` : `目前已跌破防守,停損條件已觸發;${strip(g.holdAct)}。`],
    [`${name}上檔壓力/停利價在哪?`, g.tp1 > 0 ? `${g.cls === 'o' ? '反彈壓力' : '停利參考①'} ${fmt(g.tp1)} 元(${strip(g.tp1Why)})${g.tp2 > 0 && g.cls !== 'o' ? `;停利參考② ${fmt(g.tp2)} 元(${strip(g.tp2Why)})` : ''}。` : '目前沒有停利參考價(停損訊號或資料不足)。'],
  ];
  let etfHtml = '';
  if(etfM && !etfM.err){
    const P = v => v == null ? '未滿期' : `<b class="${v >= 0 ? 'up' : 'down'}">${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%</b>`;
    etfHtml = `<h2>🐢 存股數據(含息總報酬)</h2><div class="card"><table>
<tr><th>近 1 年含息</th><td>${P(etfM.r1)}</td></tr><tr><th>近 3 年含息</th><td>${P(etfM.r3)}${etfM.r3a != null ? `(年化 ${(etfM.r3a * 100).toFixed(1)}%)` : ''}</td></tr>
<tr><th>3 年最大回檔</th><td>${P(etfM.mdd3)}(${esc(etfM.mdd3Peak)} → ${esc(etfM.mdd3Trough)})</td></tr><tr><th>離一年高點</th><td>${P(etfM.ddNow)}</td></tr>
<tr><th>配息</th><td>${etfM.freq}${etfM.freq !== '不配息' ? `,近 ${etfM.nDiv} 次合計 ${etfM.ttm} 元,殖利率 <b>${(etfM.yld * 100).toFixed(2)}%</b>` : ''}</td></tr>
${etfM.fill ? `<tr><th>最近填息</th><td>${esc(etfM.fill.date)} 除息 ${etfM.fill.amt} 元,${etfM.fill.filled ? `${etfM.fill.days} 天填息` : `已 ${etfM.fill.days} 天未填息`}</td></tr>` : ''}
<tr><th>每月存 1 萬</th><td>${etfM.dca.months} 個月投入 ${Math.round(etfM.dca.invested / 1e4)} 萬,現值 ${(etfM.dca.value / 1e4).toFixed(1)} 萬(${P(etfM.dca.ret)})</td></tr></table>
<p class="muted">含息報酬=除息與分割還原後股價(股息再投入),未扣手續費與內扣費用;殖利率為過去配息,不保證未來。</p></div>`;
    if(etfM.freq !== '不配息') faq.push([`${name}殖利率多少?多久配一次?`, `${etfM.freq},最近 ${etfM.nDiv} 次合計 ${etfM.ttm} 元,以現價計算殖利率 ${(etfM.yld * 100).toFixed(2)}%(過去配息,不保證未來)。`]);
    if(etfM.r3 != null) faq.push([`${name}近 3 年報酬多少?`, `含息總報酬 ${(etfM.r3 * 100).toFixed(1)}%,年化 ${(etfM.r3a * 100).toFixed(1)}%;3 年內最大回檔 ${(etfM.mdd3 * 100).toFixed(1)}%。`]);
  }
  const title = `${name}(${id})${isEtf ? 'ETF' : ''}今日訊號、停損價、停利價${isEtf ? '、殖利率' : ''}｜${md} 更新｜阿康的台股 AI 作戰室`;
  const desc = `${name}(${id}) ${md} 收盤 ${fmt(raw)} 元(${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%)。訊號:${tagPlain}${g.stop > 0 ? `,停損參考 ${fmt(g.stop)}` : ''}${g.tp1 > 0 ? `,${g.cls === 'o' ? '壓力' : '停利參考'} ${fmt(g.tp1)}` : ''}。五燈 ${ck.score}/${ck.nItems}${isEtf && etfM && etfM.yld ? `,殖利率 ${(etfM.yld * 100).toFixed(2)}%` : ''}。免費、每日更新。`;
  const canon = `${SITE}/stock/${id}`;
  const body = `<p class="crumb"><a href="/">阿康的台股 AI 作戰室</a> › <a href="/stock/">個股與 ETF 分析</a> › ${esc(name)}</p>
<h1>${esc(name)}(${id})${isEtf ? 'ETF' : ''}技術分析:今日訊號、停損與停利參考價</h1>
<p class="muted">${esc(ind || (isEtf ? 'ETF' : ''))}|資料日 ${date}(收盤)|每日自動更新|作者:阿康 goodskang</p>
<p><span class="px ${chg >= 0 ? 'up' : 'down'}">${fmt(raw)}</span> <b class="${chg >= 0 ? 'up' : 'down'}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</b>${r.exDiv ? ' <span class="muted">(今日除息,漲跌已扣除股息)</span>' : ''}</p>
<div class="card"><div class="tag">${esc(g.tag || '')}</div><p>${esc(strip(g.act))}</p><table>${rows.map(([k, v, w]) => `<tr><th>${k}</th><td>${v}<br><span class="muted">${w}</span></td></tr>`).join('')}</table>
<p><b>💼 ${esc(strip(g.holdAct))}</b></p></div>
<a class="cta" href="/?s=${id}">🔍 開啟 ${esc(name)} 互動分析(標註 K 線、成本試算、回測)→</a>
<h2>📐 順勢技術檢查表(${ck.score}/${ck.nItems} 綠燈)</h2><div class="card"><p><b>${esc(verdict)}</b></p>
${ck.items.map(x => `<p>${x.icon} <b>${esc(x.name)}:</b>${esc(strip(x.txt))}</p>`).join('')}
<p>🎯 <b>進場劇本:</b>${esc(strip(ck.entry))}</p><p>🛡 <b>防守說明:</b>${esc(strip(ck.stop))}</p></div>
${etfHtml}
<h2>❓ 常見問題</h2>${faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="disc">⚠️ ${DISC}價位依頭底結構、月線、前高與平均日振幅自動計算,資料來源:FinMind 公開資料(證交所/櫃買)。</p>
<h2>其他個股與 ETF</h2>${linksHtml(id)}
<p class="muted">© 2026 阿康 goodskang|<a href="https://www.youtube.com/@goodskang">YouTube</a>|<a href="https://goodskang.tw/">科技網站</a></p>`;
  const ld = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'WebPage', '@id': canon, url: canon, name: title, description: desc, inLanguage: 'zh-Hant-TW', dateModified: date, author: {'@type': 'Person', name: '阿康 goodskang', url: 'https://www.youtube.com/@goodskang'},
      isPartOf: {'@type': 'WebSite', name: '阿康的台股 AI 作戰室', url: SITE + '/'}, about: {'@type': 'Corporation', name, tickerSymbol: id}},
    {'@type': 'BreadcrumbList', itemListElement: [{'@type': 'ListItem', position: 1, name: '阿康的台股 AI 作戰室', item: SITE + '/'}, {'@type': 'ListItem', position: 2, name: '個股與 ETF 分析', item: SITE + '/stock/'}, {'@type': 'ListItem', position: 3, name: `${name}(${id})`, item: canon}]},
    {'@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a}}))}]};
  return {statusCode: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=1800', 'netlify-cdn-cache-control': 'public, s-maxage=43200, stale-while-revalidate=86400, durable'}, body: shell({title, desc, canon, body, ld})};
}
async function hubPage(){
  const etf = IDS.filter(x => /^00/.test(x)), stk = IDS.filter(x => !/^00/.test(x));
  let names = {};
  const body = `<p class="crumb"><a href="/">阿康的台股 AI 作戰室</a> › 個股與 ETF 分析</p><h1>台股個股與 ETF 每日分析:訊號、停損、停利參考價</h1>
<p>每一檔都用同一套順勢規則(頭底結構、月線、量價、法人籌碼、防守位)每日自動計算,ETF 另附含息總報酬、最大回檔、殖利率與配息頻率。</p>
<h2>📈 個股</h2><p class="links">${stk.map(x => `<a href="/stock/${x}">${esc(NAME[x] || '')} ${x}</a>`).join('')}</p>
<h2>🐢 ETF</h2><p class="links">${etf.map(x => `<a href="/stock/${x}">${esc(NAME[x] || '')} ${x}</a>`).join('')}</p>
<a class="cta" href="/">開啟互動版作戰室 →</a><p class="disc">⚠️ ${DISC}</p>`;
  const ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', name: '台股個股與 ETF 每日分析', url: SITE + '/stock/', inLanguage: 'zh-Hant-TW'};
  return {statusCode: 200, headers: {'content-type': 'text/html; charset=utf-8', 'netlify-cdn-cache-control': 'public, s-maxage=86400, durable'}, body: shell({title: '台股個股與 ETF 每日分析|停損停利參考價、殖利率、含息報酬|阿康的台股 AI 作戰室', desc: '台積電、聯電、鴻海、0050、0056、00878 等熱門台股與 ETF 每日自動分析:今日訊號、進場參考、停損與停利參考價、五燈技術檢查表,ETF 含息報酬與殖利率。免費。', canon: SITE + '/stock/', body, ld})};
}
function sitemap(){
  const today = ymd(new Date());
  const urls = [`${SITE}/`, `${SITE}/stock/`].concat(IDS.map(x => `${SITE}/stock/${x}`));
  return {statusCode: 200, headers: {'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600'},
    body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>`).join('\n')}\n</urlset>`};
}
exports.handler = async (event) => {
  // 路由:Netlify rewrite 後 event.path 可能是原始路徑(/stock/2330)或函式路徑(/.netlify/functions/page/2330)——兩種都取最後一段
  const q = event.queryStringParameters || {};
  const seg = String(event.path || '').replace(/\/+$/, '').split('/').pop() || '';
  if(q.sitemap || /^sitemap(\.xml)?$/i.test(seg)) return sitemap();
  // /list → 股票代號名稱清單(搜尋框用):全站共用 CDN 快取一天,手機不用自己抓 FinMind 整包
  if(/\/list$/.test(String(event.path || '')) || q.list){
    const info = await get('TaiwanStockInfo');
    if(!info || !info.length) return {statusCode: 503, headers: {'cache-control': 'no-store'}, body: '[]'};
    const seen = new Map(); for(const s of info) if(/^\d{4,6}[A-Z]?$/.test(s.stock_id) && !seen.has(s.stock_id)) seen.set(s.stock_id, s.stock_name);
    return {statusCode: 200, headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=3600', 'netlify-cdn-cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800, durable'}, body: JSON.stringify([...seen])};
  }
  // /picks → 今日進場訊號榜:強勢股雷達+話題雷達+常客,每檔訊號(走本站 /sig 的 CDN 快取),🟢 排前面
  if(/\/picks$/.test(String(event.path || '')) || q.picks){
    const base = process.env.URL || SITE, k = String(q.k || '').replace(/\D/g, '').slice(0, 8);
    const [scan, news] = await Promise.all([fetch(base + '/.netlify/functions/scan').then(r => r.json()).catch(() => ({})), fetch(base + '/.netlify/functions/news').then(r => r.json()).catch(() => ({}))]);
    const src = {};
    for(const x of (scan.list || [])) src[x.id] = src[x.id] || {name: x.name, from: x.k ? '人氣' : '強勢', pct: x.pct};
    for(const x of (news.top || []).slice(0, 15)) src[x.id] = src[x.id] || {name: NAME[x.id] || '', from: '新聞', n: x.n};
    for(const id of ['2330', '2317', '2454', '2303', '0050']) src[id] = src[id] || {name: NAME[id] || '', from: '常客'};
    const ids = Object.keys(src).slice(0, 36), out = [], t0 = Date.now();
    for(let i = 0; i < ids.length && Date.now() - t0 < 7500; i += 6){
      const part = await Promise.all(ids.slice(i, i + 6).map(id => fetch(`${base}/.netlify/functions/page/sig/${id}?k=${k}`).then(r => r.json()).catch(() => null)));
      part.forEach((g, j) => { if(g && g.cls) out.push(Object.assign({name: src[ids[i + j]].name || NAME[ids[i + j]] || '', from: src[ids[i + j]].from, pct: src[ids[i + j]].pct}, g)); });
    }
    const ord = {g: 0, y: 1, o: 2, r: 3};
    out.sort((a, b) => (ord[a.cls] - ord[b.cls]) || ((b.rr || 0) - (a.rr || 0)));
    const full = out.length >= Math.min(ids.length, 20);
    return {statusCode: 200, headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=600', 'netlify-cdn-cache-control': full ? 'public, s-maxage=86400, stale-while-revalidate=86400, durable' : 'public, s-maxage=300'},
      body: JSON.stringify({k, d: scan.d || '', n: ids.length, list: out})};
  }
  // /sig/:id → 雷達卡徽章用的精簡訊號(JSON),CDN 快取 6 小時:全站共用一份,手機不用自己抓 5 支 API 算
  if(/\/sig\/[^/]+$/.test(String(event.path || '')) || q.sig){
    const id = String(q.sig || seg).toUpperCase().trim();
    if(!/^\d{4,6}[A-Z]?$/.test(id)) return {statusCode: 400, body: '{}'};
    const r = await analyze(id);
    const hdr = {'content-type': 'application/json', 'cache-control': 'public, max-age=900'};
    if(r.err || !r.ck || !r.ck.sig) return {statusCode: 200, headers: Object.assign(hdr, {'netlify-cdn-cache-control': 'public, s-maxage=1800'}), body: JSON.stringify({id, none: 1})};
    const g = r.ck.sig;
    const lite = {id, date: r.date, cls: g.cls, tag: g.tag, act: strip(g.act), zone: g.zone, zoneWhy: strip(g.zoneWhy), stop: g.stop, stopPct: g.stopPct, stopWhy: g.stopWhy,
      tp1: g.tp1, tp1Pct: g.tp1Pct, tp1Why: g.tp1Why, tp2: g.tp2, tp2Pct: g.tp2Pct, tp2Why: g.tp2Why, rr: g.rr, px: g.px, holdAct: strip(g.holdAct), score: r.ck.score, nItems: r.ck.nItems, verdict: strip(r.ck.verdict), d5: r.s.length > 6 ? (r.s[r.s.length - 1].close / r.s[r.s.length - 6].close - 1) * 100 : null};
    return {statusCode: 200, headers: Object.assign(hdr, {'netlify-cdn-cache-control': q.k ? 'public, s-maxage=86400, stale-while-revalidate=86400, durable' : 'public, s-maxage=21600, stale-while-revalidate=86400, durable'}), body: JSON.stringify(lite)};
  }
  const idRaw = q.id || (/^(stock|page|hub)$/i.test(seg) ? '' : seg);
  if(q.hub || !idRaw) return hubPage();
  const id = String(idRaw).toUpperCase().trim();
  if(!/^\d{4,6}[A-Z]?$/.test(id)) return {statusCode: 404, body: 'not found'};
  return stockPage(id);
};
