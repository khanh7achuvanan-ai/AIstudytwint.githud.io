// =============================================
// DATA
// =============================================
const SUBJECTS = {
  math:        {name:'Toán',       icon:'📐', weaknesses:[{n:'Hình học không gian',l:'weak'},{n:'Tích phân',l:'medium'},{n:'Số phức',l:'weak'},{n:'Lượng giác',l:'medium'},{n:'Ma trận',l:'good'}]},
  english:     {name:'Tiếng Anh',  icon:'📘', weaknesses:[{n:'Từ vựng',l:'medium'},{n:'Phrasal verbs',l:'weak'},{n:'Writing',l:'weak'},{n:'Ngữ pháp',l:'medium'},{n:'Reading',l:'good'}]},
  physics:     {name:'Vật Lý',     icon:'⚡', weaknesses:[{n:'Điện từ',l:'weak'},{n:'Lượng tử',l:'weak'},{n:'Dao động',l:'medium'},{n:'Quang học',l:'good'}]},
  chemistry:   {name:'Hóa Học',    icon:'🧪', weaknesses:[{n:'Hóa hữu cơ',l:'medium'},{n:'Oxi hóa khử',l:'weak'},{n:'Điện phân',l:'medium'},{n:'Hóa vô cơ',l:'good'}]},
  biology:     {name:'Sinh Học',   icon:'🧬', weaknesses:[{n:'Tế bào',l:'medium'},{n:'Di truyền',l:'weak'},{n:'Tiến hóa',l:'good'}]},
  literature:  {name:'Ngữ Văn',    icon:'📖', weaknesses:[{n:'Nghị luận XH',l:'weak'},{n:'Phân tích thơ',l:'medium'},{n:'Tự luận',l:'medium'}]},
  history:     {name:'Lịch Sử',    icon:'🏛️', weaknesses:[{n:'Mốc thời gian',l:'medium'},{n:'Sự kiện TG',l:'good'},{n:'Chiến tranh VN',l:'good'}]},
  geography:   {name:'Địa Lý',     icon:'🌍', weaknesses:[{n:'Bản đồ',l:'weak'},{n:'Kinh tế vùng',l:'medium'},{n:'Khí hậu',l:'good'}]},
  civics:      {name:'GDCD',       icon:'🤝', weaknesses:[{n:'Pháp luật',l:'medium'},{n:'Đạo đức KD',l:'good'},{n:'Hiến pháp',l:'good'}]},
  informatics: {name:'Tin Học',    icon:'💻', weaknesses:[{n:'Thuật toán',l:'weak'},{n:'CTDL',l:'medium'},{n:'Python',l:'good'}]},
  technology:  {name:'Công Nghệ',  icon:'🔧', weaknesses:[{n:'Bản vẽ KT',l:'weak'},{n:'Vật liệu',l:'medium'},{n:'An toàn Điện',l:'good'}]}
};

// Hệ số điểm
const WEIGHT = {tx:1, gk:2, ck:3};
const TYPE_LABEL = {tx:'Thường Xuyên', gk:'Giữa Kỳ', ck:'Cuối Kỳ'};
const SEM_LABEL = {hk1:'Học Kỳ 1', hk2:'Học Kỳ 2'};

// =============================================
// STORAGE
// =============================================
const LS = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
};

// =============================================
// STATE
// =============================================
let state = {
  subject: 'english',
  chartSubject: 'english',
  chartView: 'all', // all | hk1 | hk2
  // grades: { subjectKey: [ {type, semester, value, note, date} ] }
  grades: LS.get('grades', {}),
  twin: LS.get('twin', {lv:1, xp:0, energy:100}),
  streak: LS.get('streak', {count:0, last:null}),
  schedule: LS.get('sched', [
    {s:'📘 Tiếng Anh', t:'08:00 - 09:30', done:false},
    {s:'📐 Toán',      t:'09:45 - 11:15', done:false}
  ]),
  chatHistory: []
};

// =============================================
// GRADE HELPERS
// =============================================
function getGrades(subKey) {
  return state.grades[subKey] || [];
}
function addGrade(subKey, entry) {
  if (!state.grades[subKey]) state.grades[subKey] = [];
  state.grades[subKey].unshift(entry); // newest first
  LS.set('grades', state.grades);
}
function delGrade(subKey, idx) {
  state.grades[subKey].splice(idx,1);
  LS.set('grades', state.grades);
}

// Calculate weighted average for a subject + optional semester filter
function calcAvg(subKey, semFilter=null) {
  const entries = getGrades(subKey).filter(e => !semFilter || e.semester===semFilter);
  if (!entries.length) return null;
  let sumW=0, sumV=0;
  entries.forEach(e => { sumW += WEIGHT[e.type]; sumV += WEIGHT[e.type]*e.value; });
  return sumW ? +(sumV/sumW).toFixed(2) : null;
}

function scoreClass(v) {
  if (v===null||v===undefined) return '';
  if (v>=8) return 'score-high';
  if (v>=6.5) return 'score-mid';
  return 'score-low';
}

// =============================================
// AI SERVICE — uses Anthropic API (no user key)
// =============================================
async function callAI(prompt, history=[]) {
  const messages = [...history, {role:'user', content: prompt}];
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'Bạn là AI Study Twin thông minh cho học sinh Việt Nam. Xưng "mình", gọi "bạn". Trả lời ngắn gọn, súc tích, tiếng Việt, dùng emoji vừa phải. Luôn hữu ích, động viên, và thực tế.',
        messages
      })
    });
    const d = await r.json();
    if (d.error) { toast('❌ '+d.error.message,'err'); return null; }
    return d.content[0].text;
  } catch(e) {
    // Fallback: smart local responses
    return localAIFallback(prompt);
  }
}

function localAIFallback(prompt) {
  const sub = SUBJECTS[state.subject];
  const avg = calcAvg(state.subject);
  const p = prompt.toLowerCase();
  if (p.includes('lộ trình') || p.includes('học nhanh')) {
    return `📚 Để cải thiện ${sub.name}, mình gợi ý:\n1. Ôn lại lý thuyết cơ bản\n2. Làm bài tập từ dễ đến khó\n3. Luyện đề thi thử thường xuyên`;
  }
  if (avg && avg < 6.5) return `💪 Điểm TB ${sub.name} của bạn là ${avg} — cần cố gắng thêm! Hãy ưu tiên ôn ${sub.weaknesses[0].n} trước.`;
  if (avg && avg >= 8) return `🎉 Bạn học ${sub.name} rất tốt với TB ${avg}! Hãy duy trì phong độ và thử sức với bài khó hơn.`;
  return `💡 Mình khuyên bạn nên lập kế hoạch ôn tập ${sub.name} đều đặn mỗi ngày. Tập trung vào ${sub.weaknesses.filter(w=>w.l==='weak').map(w=>w.n).join(', ')} nhé!`;
}

// =============================================
// RENDER: GRADE TABLE
// =============================================
function renderGradeTable() {
  const sub = SUBJECTS[state.subject];
  document.getElementById('gradeSubName').textContent = sub.icon+' '+sub.name;

  const avg = calcAvg(state.subject);
  document.getElementById('gradeSubAvg').textContent = avg!==null ? `Trung bình: ${avg}` : 'Trung bình: —';
  document.getElementById('gradeSubAvg').className = 'gsub-avg '+(avg!==null ? scoreClass(avg) : '');

  const grades = getGrades(state.subject);
  const tbody = document.getElementById('gradeTableBody');
  document.getElementById('emptyGrades').style.display = grades.length ? 'none' : 'block';

  tbody.innerHTML = grades.map((e,i) => `
    <tr>
      <td><span class="badge-${e.type}">${TYPE_LABEL[e.type]}</span></td>
      <td><span class="badge-${e.semester}">${SEM_LABEL[e.semester]}</span></td>
      <td><span class="score-cell ${scoreClass(e.value)}">${e.value}</span></td>
      <td style="color:var(--muted);font-size:.8rem">${e.note||'—'}</td>
      <td style="color:var(--muted);font-size:.78rem;white-space:nowrap">${e.date}</td>
      <td><button class="del-btn" onclick="deleteGrade(${i})">🗑</button></td>
    </tr>
  `).join('');

  renderSemesterSummary();
}

function renderSemesterSummary() {
  const container = document.getElementById('semesterSummary');
  const sems = ['hk1','hk2'];
  const types = ['tx','gk','ck'];

  container.innerHTML = sems.map(sem => {
    const entries = getGrades(state.subject).filter(e=>e.semester===sem);
    if (!entries.length) return '';
    const avg = calcAvg(state.subject, sem);
    const rows = types.map(t => {
      const list = entries.filter(e=>e.type===t);
      if (!list.length) return '';
      const a = list.reduce((s,e)=>s+e.value,0)/list.length;
      return `<div class="sem-row"><span>${TYPE_LABEL[t]}</span><span class="${scoreClass(a)}">${a.toFixed(2)}</span></div>`;
    }).join('');
    return `
      <div class="sem-block">
        <div class="sem-title">${SEM_LABEL[sem]}</div>
        ${rows}
        <div class="sem-total"><span>TB có trọng số</span><span class="${scoreClass(avg)}">${avg!==null?avg:'—'}</span></div>
      </div>
    `;
  }).join('');
}

// =============================================
// RENDER: CHARTS
// =============================================
let gradeChartInst = null;
let allSubChartInst = null;

function renderGradeChart() {
  const subKey = state.chartSubject;
  let entries = getGrades(subKey);
  if (state.chartView !== 'all') entries = entries.filter(e=>e.semester===state.chartView);
  // Sort by date ascending
  entries = [...entries].reverse();

  const txData=[], gkData=[], ckData=[], labels=[];
  let idx=0;
  entries.forEach(e=>{
    idx++;
    labels.push(`#${idx} ${e.note||TYPE_LABEL[e.type]}`);
    txData.push(e.type==='tx' ? e.value : null);
    gkData.push(e.type==='gk' ? e.value : null);
    ckData.push(e.type==='ck' ? e.value : null);
  });

  const ctx = document.getElementById('gradeChart');
  if (gradeChartInst) gradeChartInst.destroy();

  if (!entries.length) {
    ctx.getContext('2d').clearRect(0,0,ctx.width,ctx.height);
    document.getElementById('chartStatsRow').innerHTML='<div style="color:var(--muted);font-size:.82rem;padding:8px">Chưa có điểm — hãy nhập điểm để xem biểu đồ!</div>';
    return;
  }

  const chartOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{display:false},
      tooltip:{backgroundColor:'#0f1219',borderColor:'rgba(79,142,247,0.25)',borderWidth:1,titleColor:'#e2e8f0',bodyColor:'#718096',callbacks:{
        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y!==null ? ctx.parsed.y : '—'}`
      }}
    },
    scales:{
      x:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:'#4a5568',font:{size:10},maxRotation:45}},
      y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:'#4a5568',font:{size:10}},min:0,max:10,stepSize:1}
    }
  };

  gradeChartInst = new Chart(ctx, {
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'Thường Xuyên',data:txData,borderColor:'#22d3a5',backgroundColor:'rgba(34,211,165,0.08)',borderWidth:2.5,fill:false,tension:.35,pointBackgroundColor:'#22d3a5',pointRadius:5,pointHoverRadius:7,spanGaps:false},
        {label:'Giữa Kỳ',data:gkData,borderColor:'#4f8ef7',backgroundColor:'rgba(79,142,247,0.08)',borderWidth:2.5,fill:false,tension:.35,pointBackgroundColor:'#4f8ef7',pointRadius:6,pointHoverRadius:8,spanGaps:false},
        {label:'Cuối Kỳ',data:ckData,borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,0.08)',borderWidth:2.5,fill:false,tension:.35,pointBackgroundColor:'#a855f7',pointRadius:7,pointHoverRadius:9,spanGaps:false}
      ]
    },
    options:chartOpts
  });

  // Stats row
  const txEntries = entries.filter(e=>e.type==='tx');
  const gkEntries = entries.filter(e=>e.type==='gk');
  const ckEntries = entries.filter(e=>e.type==='ck');
  const avg = v => v.length ? (v.reduce((s,e)=>s+e.value,0)/v.length).toFixed(2) : '—';
  const wAvg = calcAvg(subKey, state.chartView==='all'?null:state.chartView);

  document.getElementById('chartStatsRow').innerHTML = `
    <div class="cstat"><div class="cstat-lbl">TB Thường Xuyên</div><div class="cstat-val" style="color:var(--green)">${avg(txEntries)}</div></div>
    <div class="cstat"><div class="cstat-lbl">TB Giữa Kỳ</div><div class="cstat-val" style="color:var(--blue)">${avg(gkEntries)}</div></div>
    <div class="cstat"><div class="cstat-lbl">TB Cuối Kỳ</div><div class="cstat-val" style="color:var(--purple)">${avg(ckEntries)}</div></div>
    <div class="cstat"><div class="cstat-lbl">TB Có Trọng Số</div><div class="cstat-val ${scoreClass(wAvg)}">${wAvg!==null?wAvg:'—'}</div></div>
  `;
}

function renderAllSubChart() {
  const subKeys = Object.keys(SUBJECTS);
  const labels = subKeys.map(k=>SUBJECTS[k].icon+' '+SUBJECTS[k].name);
  const data = subKeys.map(k=>calcAvg(k));
  const colors = data.map(v=> v===null ? 'rgba(74,85,104,0.4)' : v>=8 ? 'rgba(34,211,165,0.7)' : v>=6.5 ? 'rgba(79,142,247,0.7)' : 'rgba(244,63,94,0.7)');
  const borders = data.map(v=> v===null ? '#4a5568' : v>=8 ? '#22d3a5' : v>=6.5 ? '#4f8ef7' : '#f43f5e');

  const ctx = document.getElementById('allSubChart');
  if (allSubChartInst) allSubChartInst.destroy();

  allSubChartInst = new Chart(ctx, {
    type:'bar',
    data:{
      labels,
      datasets:[{
        label:'Điểm TB',
        data: data.map(v=>v!==null?v:0),
        backgroundColor: colors,
        borderColor: borders,
        borderWidth:1.5,
        borderRadius:6,
        borderSkipped:false
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#0f1219',borderColor:'rgba(79,142,247,0.25)',borderWidth:1,titleColor:'#e2e8f0',bodyColor:'#718096'}},
      scales:{
        x:{grid:{display:false},ticks:{color:'#4a5568',font:{size:10}}},
        y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:'#4a5568',font:{size:10}},min:0,max:10,stepSize:1}
      }
    }
  });
}

// =============================================
// RENDER: STATS
// =============================================
function renderStats() {
  const sub = SUBJECTS[state.subject];
  const avg = calcAvg(state.subject);
  document.getElementById('statSubName').textContent = sub.name;
  document.getElementById('statGPA').textContent = avg!==null ? avg : '—';
  document.getElementById('gpaBar').style.width = avg!==null ? (avg*10)+'%' : '0%';

  // Overall average
  const allAvgs = Object.keys(SUBJECTS).map(k=>calcAvg(k)).filter(v=>v!==null);
  const overall = allAvgs.length ? +(allAvgs.reduce((s,v)=>s+v,0)/allAvgs.length).toFixed(2) : null;
  document.getElementById('overallGPA').textContent = overall!==null ? overall : '—';
  document.getElementById('overallBar').style.width = overall!==null ? (overall*10)+'%' : '0%';

  // Weakest subject
  const withData = Object.entries(SUBJECTS).map(([k,v])=>({k,v,avg:calcAvg(k)})).filter(x=>x.avg!==null);
  if (withData.length) {
    const weakest = withData.reduce((a,b)=>a.avg<b.avg?a:b);
    document.getElementById('weakSubject').textContent = weakest.v.icon+' '+weakest.v.name+' ('+weakest.avg+')';
    document.getElementById('weakBar').style.width = (weakest.avg*10)+'%';
  }

  // Insight
  if (avg!==null) {
    const sub = SUBJECTS[state.subject];
    if (avg<6.5) document.getElementById('insightBox').textContent = `⚠️ ${sub.name} đang cần cải thiện (TB ${avg}). Hãy tập trung ôn ${sub.weaknesses.filter(w=>w.l==='weak')[0]?.n||'bài cơ bản'} trước!`;
    else if (avg>=8) document.getElementById('insightBox').textContent = `🌟 ${sub.name} rất tốt (TB ${avg})! Thử sức với bài khó hơn để đạt 9-10 nhé!`;
    else document.getElementById('insightBox').textContent = `💪 ${sub.name} ổn (TB ${avg}). Còn ${(8-avg).toFixed(1)} điểm nữa để lên giỏi — tập trung ôn giữa kỳ & cuối kỳ!`;
  }
}

// =============================================
// RENDER: KNOWLEDGE
// =============================================
function renderKnowledge() {
  const sub = SUBJECTS[state.subject];
  document.getElementById('ctxSubject').textContent = sub.icon+' '+sub.name;
  const weak = sub.weaknesses.filter(w=>w.l!=='good')[0];
  document.getElementById('ctxWeak').textContent = weak ? weak.n : 'Tốt!';
  document.getElementById('skillNodes').innerHTML = sub.weaknesses.map(w=>`
    <span class="snode ${w.l}" onclick="showRoadmap('${w.n}')">${w.l==='weak'?'⚠️':w.l==='medium'?'📈':'✅'} ${w.n}</span>
  `).join('');
}

// =============================================
// RENDER: SCHEDULE
// =============================================
function renderSchedule() {
  const list = document.getElementById('schedList');
  if (!state.schedule.length) {
    list.innerHTML='<div style="color:var(--muted);font-size:.8rem;text-align:center;padding:12px">Chưa có lịch — thêm lịch học của bạn!</div>';
    return;
  }
  list.innerHTML = state.schedule.map((item,i)=>`
    <div class="sched-item ${item.done?'done':''}">
      <div class="sched-dot" style="background:${item.done?'#4a5568':'var(--green)'}"></div>
      <div class="sched-name">${item.s}</div>
      <div class="sched-time" id="stime_${i}" onclick="editSchedTime(${i})" title="Click để sửa giờ">${item.t}</div>
      <button class="sched-check" onclick="toggleSched(${i})">${item.done?'↩':'✓'}</button>
      <button class="sched-del" onclick="delSched(${i})">×</button>
    </div>
  `).join('');
}
window.editSchedTime = function(i) {
  const cell = document.getElementById('stime_'+i);
  if (!cell) return;
  cell.innerHTML=`<input type="text" value="${state.schedule[i].t}" id="etInput_${i}"
    style="background:rgba(0,0,0,0.4);border:1px solid var(--blue);color:var(--text);padding:2px 6px;border-radius:5px;font-size:.75rem;width:110px;font-family:inherit"
    onblur="saveSchedTime(${i})"
    onkeydown="if(event.key==='Enter')saveSchedTime(${i});if(event.key==='Escape')renderSchedule();">`;
  document.getElementById('etInput_'+i)?.focus();
};
window.saveSchedTime = function(i) {
  const input = document.getElementById('etInput_'+i);
  if (!input) return;
  const v = input.value.trim();
  if (v) { state.schedule[i].t=v; LS.set('sched',state.schedule); toast('✏️ Đã cập nhật giờ','ok'); }
  renderSchedule();
};

// =============================================
// RENDER: TWIN
// =============================================
function renderTwin() {
  const {lv,xp,energy} = state.twin;
  const xpN = lv*100;
  document.getElementById('twinLv').textContent = 'Lv.'+lv;
  document.getElementById('twinXP').textContent = xp;
  document.getElementById('twinEn').textContent = energy+'%';
  document.getElementById('xpText').textContent = xp+'/'+xpN;
  document.getElementById('xpFill').style.width = (xp/xpN*100)+'%';
  document.getElementById('streakBadge').textContent = '🔥 '+state.streak.count+' ngày';
  document.getElementById('streakNum').textContent = state.streak.count;
  document.getElementById('streakBar').style.width = Math.min(state.streak.count*10,100)+'%';
}

// =============================================
// RENDER ALL
// =============================================
function renderAll() {
  renderStats();
  renderGradeTable();
  renderGradeChart();
  renderAllSubChart();
  renderKnowledge();
  renderSchedule();
  renderTwin();
}

// =============================================
// ACTIONS
// =============================================
window.deleteGrade = function(idx) {
  delGrade(state.subject, idx);
  renderAll();
  toast('🗑 Đã xóa điểm','ok');
};

function addGradeEntry() {
  const val = parseFloat(document.getElementById('gradeValue').value);
  if (isNaN(val)||val<0||val>10) { toast('❌ Điểm phải từ 0 đến 10','err'); return; }
  const entry = {
    type: document.getElementById('gradeType').value,
    semester: document.getElementById('gradeSemester').value,
    value: val,
    note: document.getElementById('gradeNote').value.trim(),
    date: new Date().toLocaleDateString('vi-VN')
  };
  addGrade(state.subject, entry);
  gainXP(8);
  document.getElementById('gradeValue').value='';
  document.getElementById('gradeNote').value='';
  renderAll();
  toast('✅ Đã thêm điểm '+val+' ('+TYPE_LABEL[entry.type]+')','ok');
}

function toggleSched(i) {
  state.schedule[i].done=!state.schedule[i].done;
  LS.set('sched',state.schedule);
  renderSchedule();
  if (state.schedule[i].done){gainXP(15);toast('✅ Hoàn thành!','ok');}
}
function delSched(i) {
  state.schedule.splice(i,1);
  LS.set('sched',state.schedule);
  renderSchedule();
}
function addSched() {
  const s = document.getElementById('schedSubject').value.trim();
  if (!s) { toast('❌ Nhập tên môn học!','err'); return; }
  let t = document.getElementById('schedTimeCustom').value.trim();
  if (!t) {
    const start = document.getElementById('schedStart').value;
    const end   = document.getElementById('schedEnd').value;
    if (start && end) {
      if (start >= end) { toast('❌ Giờ kết thúc phải sau giờ bắt đầu!','err'); return; }
      t = start + ' - ' + end;
    } else { toast('❌ Nhập giờ học (ô text hoặc chọn giờ)!','err'); return; }
  }
  state.schedule.push({s, t, done:false});
  LS.set('sched',state.schedule);
  renderSchedule();
  document.getElementById('schedSubject').value='';
  document.getElementById('schedTimeCustom').value='';
  document.getElementById('schedStart').value='';
  document.getElementById('schedEnd').value='';
  toast('📅 Đã thêm: '+s+' lúc '+t,'ok');
}

function gainXP(amt) {
  state.twin.xp+=amt;
  if(state.twin.xp>=state.twin.lv*100){
    state.twin.lv++;state.twin.xp=0;
    toast(`🎉 Level Up! Lv.${state.twin.lv}!`,'ok');
  }
  LS.set('twin',state.twin);
  renderTwin();
}

// =============================================
// AI CHAT
// =============================================
async function sendChat() {
  const input = document.getElementById('chatInput');
  const q = input.value.trim();
  if (!q) return;
  input.value='';
  const box = document.getElementById('chatBox');
  box.innerHTML += `<div class="msg"><div class="msg-avatar user">🧑</div><div class="msg-bubble">${escHtml(q)}</div></div>`;
  const tid='t'+Date.now();
  box.innerHTML += `<div class="msg" id="${tid}"><div class="msg-avatar ai">🤖</div><div class="msg-bubble ai"><div class="typing"><span></span><span></span><span></span></div></div></div>`;
  box.scrollTop=box.scrollHeight;
  const sub = SUBJECTS[state.subject];
  const avg = calcAvg(state.subject);
  const context = avg!==null ? `[Môn ${sub.name}, TB hiện tại: ${avg}]` : `[Môn ${sub.name}]`;
  const res = await callAI(`${context} ${q}`, state.chatHistory);
  document.getElementById(tid)?.remove();
  if(res){
    box.innerHTML+=`<div class="msg"><div class="msg-avatar ai">🤖</div><div class="msg-bubble ai">${escHtml(res)}</div></div>`;
    state.chatHistory.push({role:'user',content:q},{role:'assistant',content:res});
    if(state.chatHistory.length>16) state.chatHistory=state.chatHistory.slice(-16);
    gainXP(5);
  }
  box.scrollTop=box.scrollHeight;
}

// =============================================
// AI SCHEDULE
// =============================================
async function genSchedule() {
  const sub=SUBJECTS[state.subject];
  const btn=document.getElementById('genSchedBtn');
  btn.textContent='⏳...';btn.disabled=true;
  const avg=calcAvg(state.subject);
  const prompt=`Gợi ý lịch học ${sub.name} hôm nay${avg?` (TB ${avg})`:''}. Format mỗi dòng: "Tên hoạt động|HH:MM - HH:MM". Chỉ 3 dòng, không giải thích.`;
  const res=await callAI(prompt);
  btn.textContent='⚡ AI Gợi ý';btn.disabled=false;
  if(!res)return;
  res.trim().split('\n').slice(0,3).forEach(line=>{
    const p=line.split('|');
    if(p.length>=2) state.schedule.push({s:sub.icon+' '+p[0].trim(),t:p[1].trim(),done:false});
  });
  LS.set('sched',state.schedule);
  renderSchedule();
  toast('📅 Đã tạo lịch!','ok');
  gainXP(20);
}

// =============================================
// ROADMAP
// =============================================
async function showRoadmap(skill) {
  document.getElementById('roadmapTitle').textContent='🚀 Lộ trình: '+skill;
  document.getElementById('roadmapContent').innerHTML='<div class="typing"><span></span><span></span><span></span></div>';
  document.getElementById('roadmapModal').classList.add('show');
  const res=await callAI(`Lộ trình 3 bước học nhanh "${skill}" cho học sinh. Format: "Bước 1: nội dung|Bước 2: nội dung|Bước 3: nội dung". Mỗi bước 1-2 câu cụ thể.`);
  if(!res){document.getElementById('roadmapContent').textContent='❌ Lỗi tải lộ trình';return;}
  document.getElementById('roadmapContent').innerHTML=res.split('|').map((s,i)=>`
    <div class="roadmap-step"><div class="step-num">${i+1}</div><div>${escHtml(s.replace(/Bước \d+:\s*/i,'').trim())}</div></div>
  `).join('');
  gainXP(10);
}

// =============================================
// BIOMETRICS
// =============================================
function startBio() {
  setInterval(()=>{
    const hr=68+Math.floor(Math.random()*15);
    const fc=78+Math.floor(Math.random()*18);
    const bo=8+Math.floor(Math.random()*20);
    document.getElementById('heartRate').textContent=hr+' bpm';
    document.getElementById('heartRate').className='bio-val '+(hr>82?'warn':'ok');
    document.getElementById('focusVal').textContent=fc+'%';
    document.getElementById('burnoutVal').textContent=bo+'%';
    document.getElementById('moodVal').textContent=['Tốt','Tập trung','Mệt nhẹ','Hứng khởi'][Math.floor(Math.random()*4)];
  },5000);
}

// =============================================
// UTILS
// =============================================
function escHtml(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function toast(msg,type='ok'){const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;document.getElementById('toasts').appendChild(t);setTimeout(()=>t.remove(),3200);}

function updateStreak(){
  const today=new Date().toDateString();
  if(state.streak.last!==today){
    const y=new Date(Date.now()-86400000).toDateString();
    if(state.streak.last===y) state.streak.count++;
    else state.streak.count=1;
    state.streak.last=today;
    LS.set('streak',state.streak);
  }
}

// =============================================
// INIT
// =============================================
function init() {
  updateStreak();
  renderAll();
  startBio();

  // Subject picker (header)
  document.getElementById('subPicker').addEventListener('change', e=>{
    state.subject=e.target.value;
    state.chartSubject=e.target.value;
    document.getElementById('chartSubPicker').value=e.target.value;
    renderAll();
  });

  // Chart subject picker
  document.getElementById('chartSubPicker').addEventListener('change', e=>{
    state.chartSubject=e.target.value;
    renderGradeChart();
  });

  // Chart view buttons
  ['btnAll','btnHK1','btnHK2'].forEach(id=>{
    document.getElementById(id).addEventListener('click', ()=>{
      state.chartView = {btnAll:'all',btnHK1:'hk1',btnHK2:'hk2'}[id];
      document.querySelectorAll('.chip-btn').forEach(b=>b.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      renderGradeChart();
    });
  });

  // Add grade
  document.getElementById('addGradeBtn').onclick = addGradeEntry;
  document.getElementById('gradeValue').addEventListener('keypress', e=>e.key==='Enter'&&addGradeEntry());

  // Chat
  document.getElementById('sendBtn').onclick=sendChat;
  document.getElementById('chatInput').addEventListener('keypress', e=>e.key==='Enter'&&sendChat());

  // Schedule
  document.getElementById('addSchedBtn').onclick=addSched;
  document.getElementById('genSchedBtn').onclick=genSchedule;
  document.getElementById('fillTimeBtn').onclick=()=>{
    const start=document.getElementById('schedStart').value;
    const end=document.getElementById('schedEnd').value;
    if(!start||!end){toast('❌ Chọn giờ bắt đầu và kết thúc!','err');return;}
    if(start>=end){toast('❌ Giờ kết thúc phải sau giờ bắt đầu!','err');return;}
    document.getElementById('schedTimeCustom').value=start+' - '+end;
    toast('⏱ Đã điền: '+start+' - '+end,'ok');
  };

  // Roadmap
  document.getElementById('closeRoadmap').onclick=()=>document.getElementById('roadmapModal').classList.remove('show');
  document.getElementById('roadmapModal').addEventListener('click',e=>{if(e.target===document.getElementById('roadmapModal'))document.getElementById('roadmapModal').classList.remove('show');});
}

window.addEventListener('load', init);
