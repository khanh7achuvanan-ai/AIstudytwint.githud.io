// ============================================
// 1. CẤU HÌNH & TRẠNG THÁI HỆ THỐNG
// ============================================
const CONFIG = {
    API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    SYSTEM_PROMPT: "Bạn là một AI Study Twin thông minh, xưng 'mình' gọi 'bạn'. Bạn có nhiệm vụ hỗ trợ học sinh học tập một cách tích cực, ngắn gọn và truyền cảm hứng."
};

const AppState = {
    currentSubject: 'english',
    chatHistory: [], // Bộ nhớ cuộc trò chuyện
    twin: { level: 1, xp: 0, energy: 100 },
    streak: 0,
    // Dữ liệu môn học (Dựa trên khung sườn của bạn)
    subjects: {
        math: { name: 'Toán', icon: '📐', real: [6.5, 7.0, 7.2, 7.8], weaknesses: ['Hình học không gian', 'Tích phân'] },
        english: { name: 'Tiếng Anh', icon: '📘', real: [7.0, 7.3, 7.8, 8.1], weaknesses: ['Từ vựng', 'Writing'] },
        physics: { name: 'Vật Lý', icon: '⚡', real: [6.0, 6.8, 7.5, 7.9], weaknesses: ['Điện từ', 'Lượng tử'] },
        chemistry: { name: 'Hóa Học', icon: '🧪', real: [7.2, 7.5, 7.9, 8.3], weaknesses: ['Hóa hữu cơ'] },
        // ... Thêm các môn khác vào đây tương tự
    }
};

// ============================================
// 2. CORE AI SERVICE (Xử lý Gemini)
// ============================================
const AIService = {
    getApiKey: () => localStorage.getItem('gemini_api_key'),

    async call(prompt, isChat = false) {
        const key = this.getApiKey();
        if (!key) return "Vui lòng cài đặt API Key!";

        // Xây dựng nội dung gửi đi (Contextual Memory)
        let contents = [];
        if (isChat) {
            // Đưa lịch sử chat vào để AI "nhớ" ngữ cảnh
            contents = AppState.chatHistory.map(msg => ({
                role: msg.role, 
                parts: [{ text: msg.text }]
            }));
        }
        contents.push({ role: "user", parts: [{ text: prompt }] });

        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 500 } })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            return "Kết nối AI thất bại. Hãy kiểm tra Key!";
        }
    }
};

// ============================================
// 3. MODULE TÍNH NĂNG (Features)
// ============================================
const Features = {
    // 💬 CHATBOX VỚI BỘ NHỚ
    async handleChat() {
        const input = document.getElementById('searchInput');
        const query = input.value.trim();
        if (!query) return;

        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML += `<div class="chat-message"><b>🧑 Bạn:</b> ${query}</div>`;
        input.value = '';

        // Hiệu ứng đang gõ
        const typingId = `typing-${Date.now()}`;
        chatBox.innerHTML += `<div class="chat-message typing-indicator" id="${typingId}">AI đang suy nghĩ...</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

        // Lưu lịch sử của User
        AppState.chatHistory.push({ role: "user", text: query });

        const sub = AppState.subjects[AppState.currentSubject];
        const contextPrompt = `${CONFIG.SYSTEM_PROMPT}\nBối cảnh: Bạn đang hỗ trợ học môn ${sub.name}. Câu hỏi: ${query}`;
        
        const response = await AIService.call(contextPrompt, true);
        
        // Lưu lịch sử của AI và hiển thị
        AppState.chatHistory.push({ role: "model", text: response });
        document.getElementById(typingId).remove();
        chatBox.innerHTML += `<div class="chat-message ai-message"><b>🤖 AI:</b> ${response}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        App.updateXP(5);
    },

    // 📈 LỘ TRÌNH KHẮC PHỤC (CHECKLIST)
    async showRoadmap(weakness) {
        const modal = document.getElementById('roadmapPopup');
        const content = document.getElementById('popupContent');
        const subName = AppState.subjects[AppState.currentSubject].name;

        modal.classList.add('show');
        content.innerHTML = `<div class="typing-indicator">🤖 Đang lập lộ trình thực hành môn ${subName}...</div>`;

        const prompt = `Hãy lập một lộ trình thực hành gồm 3 bước cụ thể để cải thiện kỹ năng "${weakness}" môn ${subName}. 
        Trả về định dạng: Tên bước 1: Mô tả ngắn|Tên bước 2: Mô tả ngắn|Tên bước 3: Mô tả ngắn`;

        const response = await AIService.call(prompt, false);
        const steps = response.split('|');
        
        content.innerHTML = ''; // Xóa loading
        steps.forEach((step, i) => {
            const [title, desc] = step.split(':');
            content.innerHTML += `
                <div class="roadmap-step">
                    <input type="checkbox" onchange="this.parentElement.classList.toggle('completed'); App.updateXP(15);">
                    <div class="roadmap-step-content">
                        <div class="roadmap-step-title">${title || 'Bước ' + (i+1)}</div>
                        <div class="roadmap-step-desc">${desc || ''}</div>
                    </div>
                </div>`;
        });
    }
};

// ============================================
// 4. QUẢN LÝ GIAO DIỆN (UI & Logic)
// ============================================
const App = {
    init() {
        this.bindEvents();
        this.renderKnowledgeGraph();
        // Khởi tạo các thành phần khác (Chart, Biometrics...) như code cũ của bạn
    },

    bindEvents() {
        document.getElementById('searchBtn').onclick = () => Features.handleChat();
        document.getElementById('searchInput').onkeypress = (e) => e.key === 'Enter' && Features.handleChat();
        
        document.getElementById('subjectSelector').onchange = (e) => {
            AppState.currentSubject = e.target.value;
            AppState.chatHistory = []; // Đổi môn thì làm mới bộ nhớ chat
            this.renderKnowledgeGraph();
            // Cập nhật Chart...
        };

        document.getElementById('closePopupBtn').onclick = () => 
            document.getElementById('roadmapPopup').classList.remove('show');
    },

    renderKnowledgeGraph() {
        const container = document.getElementById('graphContainer');
        const sub = AppState.subjects[AppState.currentSubject];
        container.innerHTML = '';

        // Render các điểm yếu (Click để ra Roadmap)
        sub.weaknesses.forEach(w => {
            const node = document.createElement('span');
            node.className = 'skill-node weak';
            node.innerHTML = `⚠️ ${w}`;
            node.onclick = () => Features.showRoadmap(w);
            container.appendChild(node);
        });
    },

    updateXP(amount) {
        AppState.twin.xp += amount;
        if (AppState.twin.xp >= AppState.twin.level * 100) {
            AppState.twin.level++;
            AppState.twin.xp = 0;
        }
        // Update UI...
        document.getElementById('twinXP').textContent = `${AppState.twin.xp}/${AppState.twin.level * 100}`;
        document.getElementById('twinLevel').textContent = `Lv.${AppState.twin.level}`;
    }
};

// Khởi động ứng dụng
window.onload = () => App.init();
