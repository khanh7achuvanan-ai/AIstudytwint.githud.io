const SUBJECTS = {
  math:{name:'Toán',icon:'📐',real:[6.5,7.0,7.2,7.8],weaknesses:[{n:'Hình học không gian',l:'weak'},{n:'Tích phân',l:'medium'},{n:'Số phức',l:'weak'},{n:'Lượng giác',l:'medium'},{n:'Ma trận',l:'good'}]},
  english:{name:'Tiếng Anh',icon:'📘',real:[7.0,7.3,7.8,8.1],weaknesses:[{n:'Từ vựng',l:'medium'},{n:'Phrasal verbs',l:'weak'},{n:'Writing',l:'weak'},{n:'Ngữ pháp',l:'medium'},{n:'Reading',l:'good'}]},
  physics:{name:'Vật Lý',icon:'⚡',real:[6.0,6.8,7.5,7.9],weaknesses:[{n:'Điện từ',l:'weak'},{n:'Lượng tử',l:'weak'},{n:'Dao động',l:'medium'},{n:'Quang học',l:'good'}]},
  chemistry:{name:'Hóa Học',icon:'🧪',real:[7.2,7.5,7.9,8.3],weaknesses:[{n:'Hóa hữu cơ',l:'medium'},{n:'Oxi hóa khử',l:'weak'},{n:'Điện phân',l:'medium'},{n:'Hóa vô cơ',l:'good'}]},
  biology:{name:'Sinh Học',icon:'🧬',real:[7.5,7.8,8.0,8.2],weaknesses:[{n:'Cấu trúc tế bào',l:'medium'},{n:'Di truyền học',l:'weak'},{n:'Tiến hóa',l:'good'}]},
  literature:{name:'Ngữ Văn',icon:'📖',real:[7.0,7.3,7.6,7.8],weaknesses:[{n:'Nghị luận xã hội',l:'weak'},{n:'Phân tích thơ',l:'medium'},{n:'Tự luận',l:'medium'}]},
  history:{name:'Lịch Sử',icon:'🏛️',real:[7.8,8.0,8.2,8.5],weaknesses:[{n:'Mốc thời gian',l:'medium'},{n:'Sự kiện thế giới',l:'good'},{n:'Chiến tranh VN',l:'good'}]},
  geography:{name:'Địa Lý',icon:'🌍',real:[7.4,7.7,8.0,8.3],weaknesses:[{n:'Bản đồ',l:'weak'},{n:'Kinh tế vùng',l:'medium'},{n:'Khí hậu',l:'good'}]},
  civics:{name:'GDCD',icon:'🤝',real:[8.0,8.2,8.4,8.6],weaknesses:[{n:'Pháp luật',l:'medium'},{n:'Đạo đức KD',l:'good'},{n:'Hiến pháp',l:'good'}]},
  informatics:{name:'Tin Học',icon:'💻',real:[7.9,8.1,8.3,8.5],weaknesses:[{n:'Thuật toán',l:'weak'},{n:'CTDL',l:'medium'},{n:'Python',l:'good'}]},
  technology:{name:'Công Nghệ',icon:'🔧',real:[7.3,7.6,7.9,8.2],weaknesses:[{n:'Bản vẽ KT',l:'weak'},{n:'Vật liệu',l:'medium'},{n:'An toàn Điện',l:'good'}]}
};
const INSIGHTS = {
  math:'💡 Hôm nay nên ôn Tích phân — đây là điểm yếu cần cải thiện trước kỳ thi.',
  english:'💡 Practice 10 phrasal verbs/ngày + 1 đoạn Writing để tăng điểm nhanh.',
  physics:'💡 Làm thêm bài tập Điện từ trường — chiếm 30% đề thi cuối kỳ.',
  chemistry:'💡 Ôn lại cơ chế phản ứng hữu cơ, đặc biệt phần Este và Amin.',
  biology:'💡 Vẽ sơ đồ tư duy về Di truyền Mendel — hiệu quả hơn đọc thuần.',
  literature:'💡 Luyện viết đoạn nghị luận xã hội 300 từ mỗi ngày.',
  history:'💡 Tạo timeline 1945-1975 bằng sơ đồ — giúp nhớ mốc chính xác hơn.',
  geography:'💡 Học thuộc bản đồ các vùng kinh tế trọng điểm của VN.',
  civics:'💡 Tóm tắt các điều khoản Hiến pháp 2013 quan trọng vào flashcard.',
  informatics:'💡 Code thử thuật toán sắp xếp (Quicksort, Mergesort) để nắm vững.',
  technology:'💡 Thực hành đọc bản vẽ kỹ thuật 2D — nền tảng cho phần 3D.'
};
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let state={subject:'english',twin:LS.get('twin',{lv:1,xp:0,energy:100}),streak:LS.get('streak',{count:0,last:null}),schedule:LS.get('sched',[{s:'📘 Tiếng Anh',t:'08:00 - 09:30',done:false},{s:'📐 Toán',t:'09:45 - 11:15',done:false}]),chatHistory:[]};
let chart=null;

async function callAI(prompt,history=[]){
  const key=localStorage.getItem('ast_apikey');
  if(!key){toast('⚙️ Chưa có API Key — nhấn ⚙️ để thêm','err');return null;}
  const messages=[...history,{role:'user',content:prompt}];
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:400,system:'Bạn là AI Study Twin thông minh. Xưng "mình", gọi "bạn". Trả lời ngắn gọn, súc tích, dùng emoji vừa phải.',messages})});
    const d=await r.json();
    if(d.error){toast('❌ '+d.error.message,'err');return null;}
    return d.content[0].text;
  }catch(e){toast('❌ Lỗi kết nối AI','err');return null;}
}

function initChart(){
  const ctx=document.getElementById('myChart');
  if(chart)chart.destroy();
  const sub=SUBJECTS[state.subject];
  const real=[...sub.real];
  const last=real[real.length-1];
  const pred1=+(last+0.4).toFixed(1);
  const pred2=+(last+0.8).toFixed(1);
  const labels=real.map((_,i)=>`Tuần ${i+1}`).concat(['Dự báo 1','Dự báo 2']);
  c
