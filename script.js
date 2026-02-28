// ============================================
// 1. CẤU HÌNH & BỘ NHỚ VĨNH VIỄN (LocalStorage)
// ============================================
const CONFIG = {
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    SYSTEM_PROMPT: "Bạn là AI Study Twin. Xưng 'mình', gọi 'bạn'. Trả lời ngắn gọn, tập trung vào học tập."
};

const Storage = {
    save: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    load: (key, defaultValue) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }
};

// ============================================
// 2. TRẠNG THÁI HỆ THỐNG (AppState)
// ============================================
const AppState = {
    currentSubject: 'english',
    chatHistory: [],
    twin: Storage.load('ai_twin_state', { xp: 0, level: 1, energy: 100 }),
    subjects: Storage.load('ai_twin_subjects', {
        math: { name: 'Toán', icon: '📐', real: [6.5, 7.0, 7.2, 7.8], weaknesses: ['Hình học không gian', 'Tích phân'] },
        english: { name: 'Tiếng Anh', icon: '📘', real: [7.0, 7.3, 7.8, 8.1], weaknesses: ['Từ vựng', 'IELTS Writing'] },
        physics: { name: 'Vật Lý', icon: '⚡', real: [6.0, 6.8, 7.5, 7.9], weaknesses: ['Điện từ', 'Lượng tử'] },
        chemistry: { name: 'Hóa Học', icon: '🧪', real: [7.2, 7.5, 7.9, 8.3], weaknesses: ['Hóa hữu cơ'] },
        biology: { name: 'Sinh Học', icon: '🧬', real: [7.5, 8.0, 8.2], weaknesses: ['Di truyền'] }
    })
};

// ============================================
// 3. CORE AI SERVICE
// ============================================
const AIService = {
    getApiKey: () => localStorage.getItem('gemini_api_key'),

    async call(prompt, useHistory = false) {
        const apiKey = this.getApiKey();
        if (!apiKey) return "Cài API Key ở mục Settings nhé!";

        let contents = [];
        if (useHistory) {
            AppState.chatHistory.forEach(msg => contents.push({ role: msg.role, parts: [{ text: msg.text }] }));
        }
        contents.push({ role: "user", parts: [{ text: prompt }] });

        try {
            const response = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 300 } })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) { return "Lỗi kết nối AI rồi!"; }
    }
};

// ============================================
// 4. QUẢN LÝ GIAO DIỆN & TÍNH NĂNG
// ============================================
const App = {
    chart: null,

    init() {
        this.renderAll();
        this.bindEvents();
        this.startBiometrics();
        console.log("AI Study Twin đã sẵn sàng!");
    },

    bindEvents() {
        // Chat
        document.getElementById('searchBtn').onclick = () => this.handleChat();
        document.getElementById('searchInput').onkeypress = (e) => e.key === 'Enter' && this.handleChat();
        
        // Đổi môn
        document.getElementById('subjectSelector').onchange = (e) => {
            AppState.currentSubject = e.target.value;
            AppState.chatHistory = [];
            this.renderAll();
        };

        // Cài đặt API
        document.getElementById('settingsBtn').onclick = () => {
            const key = prompt("Nhập Gemini API Key của bạn:", AIService.getApiKey() || "");
            if (key) { localStorage.setItem('gemini_api_key', key); location.reload(); }
        };

        // Đóng Popup
        document.getElementById('closePopupBtn').onclick = () => document.getElementById('roadmapPopup').classList.remove('show');
    },

    async handleChat() {
        const input = document.getElementById('searchInput');
        const q = input.value.trim();
        if (!q) return;

        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML += `<div class="chat-message"><b>🧑 Bạn:</b> ${q}</div>`;
        input.value = '';

        const typingId = `typing-${Date.now()}`;
        chatBox.innerHTML += `<div class="chat-message ai-message" id="${typingId}">🤖 Đang nghĩ...</div>`;
        
        const response = await AIService.call(`(Môn ${AppState.currentSubject}): ${q}`, true);
        
        document.getElementById(typingId).remove();
        chatBox.innerHTML += `<div class="chat-message ai-message"><b>🤖 AI:</b> ${response}</div>`;
        AppState.chatHistory.push({ role: "user", text: q }, { role: "model", text: response });
        chatBox.scrollTop = chatBox.scrollHeight;
        this.updateXP(5);
    },

    async showRoadmap(skill) {
        const modal = document.getElementById('roadmapPopup');
        const content = document.getElementById('popupContent');
        modal.classList.add('show');
        content.innerHTML = "🤖 AI đang lập lộ trình...";

        const prompt = `Lập lộ trình 3 bước khắc phục "${skill}". Định dạng: Bước 1: Mô tả|Bước 2: Mô tả|Bước 3: Mô tả`;
        const res = await AIService.call(prompt);
        
        content.innerHTML = "";
        res.split('|').forEach(step => {
            const [title, desc] = step.split(':');
            content.innerHTML += `
                <div class="roadmap-step">
                    <input type="checkbox" onchange="this.parentElement.classList.toggle('completed'); App.updateXP(10);">
                    <div class="roadmap-step-content">
                        <div class="roadmap-step-title">${title}</div>
                        <div class="roadmap-step-desc">${desc || ''}</div>
                    </div>
                </div>`;
        });
    },

    updateXP(amt) {
        AppState.twin.xp += amt;
        if (AppState.twin.xp >= AppState.twin.level * 100) {
            AppState.twin.level++; AppState.twin.xp = 0;
        }
        Storage.save('ai_twin_state', AppState.twin);
        this.renderTwinUI();
    },

    renderTwinUI() {
        document.getElementById('twinXP').textContent = `${AppState.twin.xp}/${AppState.twin.level * 100}`;
        document.getElementById('twinLevel').textContent = `Lv.${AppState.twin.level}`;
        document.getElementById('twinEnergy').textContent = `${AppState.twin.energy}%`;
    },

    renderKnowledgeGraph() {
        const container = document.getElementById('graphContainer');
        const sub = AppState.subjects[AppState.currentSubject];
        container.innerHTML = '';
        sub.weaknesses.forEach(w => {
            const node = document.createElement('span');
            node.className = 'skill-node weak';
            node.innerHTML = `⚠️ ${w}`;
            node.onclick = () => this.showRoadmap(w);
            container.appendChild(node);
        });
    },

    initChart() {
        const ctx = document.getElementById('roadmapChart');
        if (this.chart) this.chart.destroy();
        const data = AppState.subjects[AppState.currentSubject].real;
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => `Lần ${i+1}`),
                datasets: [{ label: 'Điểm số', data: data, borderColor: '#2a9dff', tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    startBiometrics() {
        setInterval(() => {
            const heart = 70 + Math.floor(Math.random() * 10);
            document.getElementById('heartRate').textContent = `${heart} bpm`;
        }, 3000);
    },

    renderAll() {
        this.renderTwinUI();
        this.renderKnowledgeGraph();
        this.initChart();
    }
};

window.onload = () => App.init();
