// ============================================
// 1. CẤU HÌNH & DỮ LIỆU GỐC (11 MÔN HỌC)
// ============================================
const CONFIG = {
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    SYSTEM_PROMPT: "Bạn là AI Study Twin. Xưng 'mình', gọi 'bạn'. Trả lời cực ngắn gọn, thông minh."
};

const Storage = {
    save: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    load: (key, defaultValue) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }
};

const SubjectData = {
    math: { name: 'Toán', icon: '📐', real: [6.5, 7.0, 7.2, 7.8], weaknesses: ['Hình học không gian', 'Tích phân', 'Số phức'] },
    english: { name: 'Tiếng Anh', icon: '📘', real: [7.0, 7.3, 7.8, 8.1], weaknesses: ['Từ vựng', 'Phrasal verbs', 'IELTS Writing'] },
    physics: { name: 'Vật Lý', icon: '⚡', real: [6.0, 6.8, 7.5, 7.9], weaknesses: ['Điện từ', 'Lượng tử ánh sáng', 'Dao động'] },
    chemistry: { name: 'Hóa Học', icon: '🧪', real: [7.2, 7.5, 7.9, 8.3], weaknesses: ['Hóa hữu cơ', 'Phản ứng oxi hóa khử'] },
    biology: { name: 'Sinh Học', icon: '🧬', real: [7.5, 7.8, 8.0, 8.2], weaknesses: ['Cấu trúc tế bào', 'Di truyền học'] },
    literature: { name: 'Ngữ Văn', icon: '📖', real: [7.0, 7.3, 7.6, 7.8], weaknesses: ['Nghị luận xã hội', 'Phân tích thơ'] },
    history: { name: 'Lịch Sử', icon: '🏛️', real: [7.8, 8.0, 8.2, 8.5], weaknesses: ['Mốc thời gian', 'Sự kiện thế giới'] },
    geography: { name: 'Địa Lý', icon: '🌍', real: [7.4, 7.7, 8.0, 8.3], weaknesses: ['Bản đồ', 'Kinh tế vùng'] },
    civics: { name: 'GDCD', icon: '🤝', real: [8.0, 8.2, 8.4, 8.6], weaknesses: ['Pháp luật', 'Đạo đức kinh doanh'] },
    informatics: { name: 'Tin Học', icon: '💻', real: [7.9, 8.1, 8.3, 8.5], weaknesses: ['Thuật toán', 'Cấu trúc dữ liệu'] },
    technology: { name: 'Công Nghệ', icon: '🔧', real: [7.3, 7.6, 7.9, 8.2], weaknesses: ['Bản vẽ kỹ thuật', 'Vật liệu cơ khí'] }
};

// ============================================
// 2. QUẢN LÝ TRẠNG THÁI (STATE)
// ============================================
const AppState = {
    currentSubject: 'english',
    chatHistory: [],
    streak: Storage.load('streak', { count: 0, lastDate: null }),
    twin: Storage.load('twin_state', { level: 1, xp: 0, energy: 100 }),
    schedule: Storage.load('schedule', [
        { subject: '📘 Tiếng Anh', time: '08:00 - 09:30', completed: false },
        { subject: '📐 Toán', time: '09:45 - 11:15', completed: false }
    ])
};

// ============================================
// 3. CORE AI SERVICE
// ============================================
const AIService = {
    async call(prompt, useHistory = false) {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) return "⚠️ Thiếu API Key!";

        let contents = useHistory ? AppState.chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })) : [];
        contents.push({ role: "user", parts: [{ text: prompt }] });

        try {
            const response = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 250 } })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) { return "❌ Lỗi kết nối AI."; }
    }
};

// ============================================
// 4. ĐIỀU KHIỂN GIAO DIỆN (UI CONTROLLER)
// ============================================
const App = {
    chart: null,

    init() {
        this.renderAll();
        this.bindEvents();
        this.startBiometrics();
        console.log("🚀 Hệ thống đã phục hồi!");
    },

    bindEvents() {
        // Chat & Tìm kiếm
        document.getElementById('searchBtn').onclick = () => this.handleChat();
        document.getElementById('searchInput').onkeypress = (e) => e.key === 'Enter' && this.handleChat();
        
        // Đổi môn học
        document.getElementById('subjectSelector').onchange = (e) => {
            AppState.currentSubject = e.target.value;
            this.renderAll();
        };

        // Nút Settings (API Key)
        document.getElementById('settingsBtn').onclick = () => {
            const key = prompt("Nhập Gemini API Key:", localStorage.getItem('gemini_api_key') || "");
            if (key) { localStorage.setItem('gemini_api_key', key); location.reload(); }
        };

        // Đóng Popup Roadmap
        document.getElementById('closePopupBtn').onclick = () => document.getElementById('roadmapPopup').classList.remove('show');
        
        // Cập nhật điểm
        document.getElementById('updateScoreBtn').onclick = () => {
            const val = parseFloat(document.getElementById('newScoreInput').value);
            if (!isNaN(val) && val >= 0 && val <= 10) {
                SubjectData[AppState.currentSubject].real.push(val);
                this.renderAll();
                this.updateXP(10);
            }
        };
    },

    async handleChat() {
        const input = document.getElementById('searchInput');
        const q = input.value.trim();
        if (!q) return;

        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML += `<div class="chat-message"><b>🧑 Bạn:</b> ${q}</div>`;
        input.value = '';

        const res = await AIService.call(`(Môn ${SubjectData[AppState.currentSubject].name}): ${q}`, true);
        chatBox.innerHTML += `<div class="chat-message ai-message"><b>🤖 AI:</b> ${res}</div>`;
        AppState.chatHistory.push({ role: "user", text: q }, { role: "model", text: res });
        chatBox.scrollTop = chatBox.scrollHeight;
        this.updateXP(5);
    },

    renderKnowledgeGraph() {
        const container = document.getElementById('graphContainer');
        const sub = SubjectData[AppState.currentSubject];
        container.innerHTML = '';
        sub.weaknesses.forEach(w => {
            const node = document.createElement('span');
            node.className = 'skill-node weak';
            node.innerHTML = `⚠️ ${w}`;
            node.onclick = () => this.showRoadmap(w);
            container.appendChild(node);
        });
    },

    async showRoadmap(skill) {
        const modal = document.getElementById('roadmapPopup');
        modal.classList.add('show');
        const content = document.getElementById('popupContent');
        content.innerHTML = "🤖 Đang lập lộ trình...";

        const res = await AIService.call(`Lập lộ trình 3 bước học nhanh: ${skill}. Định dạng: Bước 1: Nội dung|Bước 2: Nội dung|Bước 3: Nội dung`);
        content.innerHTML = "";
        res.split('|').forEach(step => {
            content.innerHTML += `<div class="roadmap-step">✅ ${step.trim()}</div>`;
        });
    },

    initChart() {
        const ctx = document.getElementById('roadmapChart');
        if (this.chart) this.chart.destroy();
        const data = SubjectData[AppState.currentSubject].real;
        
        // Kiểm tra xem thư viện Chart.js có tồn tại không
        if (typeof Chart !== 'undefined') {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => `Tuần ${i+1}`),
                    datasets: [{ label: 'Điểm số', data: data, borderColor: '#2a9dff', backgroundColor: 'rgba(42,157,255,0.1)', fill: true, tension: 0.4 }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    },

    renderSchedule() {
        const list = document.getElementById('scheduleList');
        list.innerHTML = AppState.schedule.map((item, i) => `
            <div class="schedule-item">
                <span>${item.subject}</span>
                <span>${item.time}</span>
                <button onclick="this.parentElement.style.opacity=0.5">✔️</button>
            </div>
        `).join('');
    },

    updateXP(amt) {
        AppState.twin.xp += amt;
        if (AppState.twin.xp >= AppState.twin.level * 100) { AppState.twin.level++; AppState.twin.xp = 0; }
        Storage.save('twin_state', AppState.twin);
        this.renderTwinUI();
    },

    renderTwinUI() {
        document.getElementById('twinXP').innerText = `${AppState.twin.xp}/${AppState.twin.level * 100}`;
        document.getElementById('twinLevel').innerText = `Lv.${AppState.twin.level}`;
        document.getElementById('twinEnergy').innerText = `${AppState.twin.energy}%`;
        document.getElementById('streakBadge').innerText = `🔥 ${AppState.streak.count} ngày`;
    },

    startBiometrics() {
        setInterval(() => {
            document.getElementById('heartRate').innerText = (70 + Math.floor(Math.random() * 10)) + ' bpm';
            document.getElementById('focusLevel').innerText = (80 + Math.floor(Math.random() * 15)) + '%';
        }, 3000);
    },

    renderAll() {
        this.renderTwinUI();
        this.renderKnowledgeGraph();
        this.initChart();
        this.renderSchedule();
    }
};

// Khởi động
window.addEventListener('load', () => App.init());
