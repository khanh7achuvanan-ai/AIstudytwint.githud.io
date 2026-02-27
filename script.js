// ============================================
// CẤU HÌNH VÀ BIẾN TOÀN CỤC
// ============================================
const CONFIG = {
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
};

// Module quản lý lưu trữ
const Storage = {
    save: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Lưu thất bại', e);
        }
    },
    load: (key, defaultValue) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }
};

// Lấy API key từ localStorage
function getApiKey() {
    return localStorage.getItem('gemini_api_key');
}

// ============================================
// MODULE CHÍNH
// ============================================
const App = (function() {
    // Private variables
    let chart = null;
    let currentSubject = 'english';
    let xp = 0;
    let level = 1;
    let energy = 100;
    let streak = 0;
    let lastStudyDate = null;
    let scheduleItems = [];
    let countdownInterval = null;
    let biometricsInterval = null;
    let activeSessionIndex = -1;
    
    // Dữ liệu môn học (khởi tạo từ Storage hoặc mặc định)
    const subjectData = Storage.load('subjectData', {
        math: {
            name: 'Toán',
            icon: '📐',
            real: [6.5, 7.0, 7.2, 7.8],
            weaknesses: ['Hình học không gian', 'Tích phân', 'Số phức'],
            tip: '🔢 Ôn lại chuyên đề Vector.'
        },
        english: {
            name: 'Tiếng Anh',
            icon: '📘',
            real: [7.0, 7.3, 7.8, 8.1],
            weaknesses: ['Từ vựng', 'Phrasal verbs', 'IELTS Writing'],
            tip: '📘 Bạn hay quên từ vựng sau 3 ngày.'
        },
        physics: {
            name: 'Vật Lý',
            icon: '⚡',
            real: [6.0, 6.8, 7.5, 7.9],
            weaknesses: ['Điện từ', 'Lượng tử ánh sáng', 'Dao động'],
            tip: '⚡ Sai số trong bài động lượng đang tăng.'
        },
        chemistry: {
            name: 'Hóa Học',
            icon: '🧪',
            real: [7.2, 7.5, 7.9, 8.3],
            weaknesses: ['Hóa hữu cơ', 'Phản ứng oxi hóa khử'],
            tip: '🧪 Phản ứng oxi hóa khử còn yếu.'
        },
        biology: {
            name: 'Sinh Học',
            icon: '🧬',
            real: [7.5, 7.8, 8.0, 8.2],
            weaknesses: ['Cấu trúc tế bào', 'Di truyền học'],
            tip: '🧬 Cần ôn lại cấu trúc tế bào.'
        },
        literature: {
            name: 'Ngữ Văn',
            icon: '📖',
            real: [7.0, 7.3, 7.6, 7.8],
            weaknesses: ['Nghị luận xã hội', 'Phân tích thơ'],
            tip: '📖 Phân tích tác phẩm còn sơ sài.'
        },
        history: {
            name: 'Lịch Sử',
            icon: '🏛️',
            real: [7.8, 8.0, 8.2, 8.5],
            weaknesses: ['Mốc thời gian', 'Sự kiện thế giới'],
            tip: '🏛️ Hay nhầm mốc thời gian.'
        },
        geography: {
            name: 'Địa Lý',
            icon: '🌍',
            real: [7.4, 7.7, 8.0, 8.3],
            weaknesses: ['Bản đồ', 'Kinh tế vùng'],
            tip: '🌍 Bản đồ các vùng kinh tế còn lúng túng.'
        },
        civics: {
            name: 'GDCD',
            icon: '🤝',
            real: [8.0, 8.2, 8.4, 8.6],
            weaknesses: ['Pháp luật', 'Đạo đức kinh doanh'],
            tip: '🤝 Cần liên hệ thực tế nhiều hơn.'
        },
        informatics: {
            name: 'Tin Học',
            icon: '💻',
            real: [7.9, 8.1, 8.3, 8.5],
            weaknesses: ['Thuật toán', 'Cấu trúc dữ liệu'],
            tip: '💻 Thuật toán sắp xếp còn sai.'
        },
        technology: {
            name: 'Công Nghệ',
            icon: '🔧',
            real: [7.3, 7.6, 7.9, 8.2],
            weaknesses: ['Bản vẽ kỹ thuật', 'Vật liệu cơ khí'],
            tip: '🔧 Bản vẽ kỹ thuật chưa chính xác.'
        }
    });

    // Lưu lại mỗi khi thay đổi
    function saveSubjectData() {
        Storage.save('subjectData', subjectData);
    }

    // ============================================
    // HÀM GỌI GEMINI API (lấy key từ localStorage)
    // ============================================
    async function callGemini(prompt) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.warn('Chưa có API key, dùng mock response');
            return mockAIResponse(prompt);
        }
        try {
            const response = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            console.error('Lỗi gọi Gemini:', error);
            return mockAIResponse(prompt);
        }
    }

    function mockAIResponse(prompt) {
        if (prompt.includes('insight')) {
            return 'Học đều các môn, tập trung vào điểm yếu để cải thiện.';
        }
        if (prompt.includes('dự báo')) {
            return '8.4, 8.7';
        }
        if (prompt.includes('lộ trình')) {
            return 'Ôn tập theo từng bước: 1. Xem lại lý thuyết, 2. Làm bài tập cơ bản, 3. Nâng cao dần.';
        }
        return 'Chăm chỉ học tập bạn nhé!';
    }

    // ============================================
    // CẬP NHẬT DAILY INSIGHT TỪ AI
    // ============================================
    async function updateDailyInsight() {
        const data = subjectData[currentSubject];
        const lastScore = data.real[data.real.length - 1];
        const focus = document.getElementById('focusLevel').textContent;
        const heart = document.getElementById('heartRate').textContent;
        const completedSessions = scheduleItems.filter(item => item.completed).length;
        
        const prompt = `Học sinh môn ${data.name} có điểm hiện tại ${lastScore}, mức tập trung ${focus}, nhịp tim ${heart}. Đã hoàn thành ${completedSessions} ca học hôm nay. Hãy đưa ra một lời khuyên học tập ngắn gọn (dưới 100 ký tự), tập trung vào điểm yếu: ${data.weaknesses.join(', ')}.`;
        
        const advice = await callGemini(prompt);
        document.getElementById('dailyTip').textContent = advice;
    }

    // ============================================
    // DỰ BÁO ĐIỂM DỰA TRÊN TRUNG BÌNH CỘNG (không cần AI)
    // ============================================
    function predictScores(scores) {
        if (scores.length < 2) return [scores[0] + 0.5, scores[0] + 1.0];
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const trend = (scores[scores.length - 1] - scores[0]) / scores.length;
        return [
            Math.min(10, Math.max(0, avg + trend + 0.2)),
            Math.min(10, Math.max(0, avg + trend * 2 + 0.4))
        ];
    }

    // ============================================
    // KHỞI TẠO BIỂU ĐỒ
    // ============================================
    function initChart(subject) {
        const ctx = document.getElementById('roadmapChart');
        if (!ctx) return;
        if (chart) chart.destroy();

        const data = subjectData[subject];
        const predicted = predictScores(data.real);
        data.predicted = predicted;

        const labels = [...data.real.map((_, i) => `Tuần ${i+1}`), 'Dự báo 1', 'Dự báo 2'];
        const realData = [...data.real, null, null];
        const predData = [null, null, null, null, ...predicted];

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Điểm thực tế',
                        data: realData,
                        borderColor: '#2a9dff',
                        tension: 0.4,
                        pointBackgroundColor: '#2a9dff',
                    },
                    {
                        label: 'Dự báo',
                        data: predData,
                        borderColor: '#9d4edd',
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointBackgroundColor: '#9d4edd',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });

        // Cập nhật stats
        document.getElementById('statReal').textContent = data.real[data.real.length-1].toFixed(1);
        document.getElementById('statPred1').textContent = predicted[0].toFixed(1);
        document.getElementById('statPred2').textContent = predicted[1].toFixed(1);
        document.getElementById('currentGPA').textContent = data.real[data.real.length-1].toFixed(1);
        
        // Độ tin cậy giả định
        document.getElementById('confidenceValue').textContent = Math.floor(70 + Math.random() * 20) + '%';
    }

    // ============================================
    // THÊM ĐIỂM MỚI VÀ CẬP NHẬT BIỂU ĐỒ
    // ============================================
    async function addNewScore(score) {
        const data = subjectData[currentSubject];
        data.real.push(score);
        if (data.real.length > 6) data.real.shift();
        
        saveSubjectData();
        initChart(currentSubject);
        await updateDailyInsight();
        updateStreak(); // thêm điểm tính là học tập
    }

    // ============================================
    // QUẢN LÝ STREAK
    // ============================================
    function updateStreak() {
        const today = new Date().toDateString();
        if (!lastStudyDate) {
            streak = 1;
        } else if (lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastStudyDate === yesterday.toDateString()) {
                streak++;
            } else {
                streak = 1;
            }
        }
        lastStudyDate = today;
        Storage.save('streak', { streak, lastStudyDate });
        document.getElementById('streakBadge').textContent = `🔥 ${streak} ngày`;
    }

    // ============================================
    // QUẢN LÝ LỊCH HỌC
    // ============================================
    function renderSchedule() {
        const list = document.getElementById('scheduleList');
        list.innerHTML = '';
        scheduleItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'schedule-item';
            if (index === activeSessionIndex) {
                div.classList.add('active-session');
            }
            div.draggable = true;
            div.dataset.index = index;
            div.innerHTML = `
                <span class="subject">${item.subject}</span>
                <span class="time">${item.time}</span>
                <span class="countdown-timer" id="countdown-${index}"></span>
                <span class="delete-schedule" onclick="App.deleteScheduleItem(${index})">✖</span>
            `;
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragend', handleDragEnd);
            list.appendChild(div);
        });
        Storage.save('schedule', scheduleItems);
        checkActiveSession();
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function handleDrop(e) {
        e.preventDefault();
        const fromIndex = e.dataTransfer.getData('text/plain');
        const toElement = e.target.closest('.schedule-item');
        if (!toElement) return;
        const toIndex = toElement.dataset.index;
        if (fromIndex === toIndex) return;
        
        [scheduleItems[fromIndex], scheduleItems[toIndex]] = [scheduleItems[toIndex], scheduleItems[fromIndex]];
        renderSchedule();
    }

    function addScheduleItem(subject, time) {
        scheduleItems.push({ subject, time, completed: false });
        renderSchedule();
        updateStreak();
    }

    function deleteScheduleItem(index) {
        scheduleItems.splice(index, 1);
        renderSchedule();
    }

    // Kiểm tra ca học hiện tại và kích hoạt countdown
    function checkActiveSession() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let newActiveIndex = -1;
        
        scheduleItems.forEach((item, index) => {
            const [start, end] = item.time.split(' - ').map(t => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            });
            if (currentTime >= start && currentTime < end) {
                newActiveIndex = index;
            }
        });

        if (newActiveIndex !== activeSessionIndex) {
            activeSessionIndex = newActiveIndex;
            renderSchedule();
            if (activeSessionIndex !== -1) {
                startCountdownForSession(activeSessionIndex);
            } else {
                if (countdownInterval) clearInterval(countdownInterval);
            }
        }
    }

    function startCountdownForSession(index) {
        if (countdownInterval) clearInterval(countdownInterval);
        const item = scheduleItems[index];
        const endTimeStr = item.time.split(' - ')[1];
        
        countdownInterval = setInterval(() => {
            const now = new Date();
            const [h, m] = endTimeStr.split(':').map(Number);
            const end = new Date(now);
            end.setHours(h, m, 0);
            const diff = end - now;
            
            const timerSpan = document.getElementById(`countdown-${index}`);
            if (!timerSpan) return;
            
            if (diff <= 0) {
                timerSpan.textContent = '00:00';
                clearInterval(countdownInterval);
                // Đánh dấu đã hoàn thành
                item.completed = true;
                // Phát âm thanh thông báo
                document.getElementById('notificationSound').play().catch(e => console.log('Audio play failed:', e));
                // Cập nhật insight
                updateDailyInsight();
                // Xóa active session
                activeSessionIndex = -1;
                renderSchedule();
                return;
            }
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerSpan.textContent = `⏳ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // AI tạo lịch ngẫu nhiên
    function generateAISchedule() {
        const subjects = Object.values(subjectData).map(s => s.icon + ' ' + s.name);
        const times = ['07:30-09:00', '09:15-10:45', '13:30-15:00', '15:15-16:45', '19:00-20:30'];
        scheduleItems = [];
        for (let i = 0; i < 4; i++) {
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
            const randomTime = times[Math.floor(Math.random() * times.length)];
            scheduleItems.push({ subject: randomSubject, time: randomTime, completed: false });
        }
        renderSchedule();
    }

    // ============================================
    // DIGITAL TWIN TƯƠNG TÁC
    // ============================================
    function handleTwinClick() {
        const avatar = document.getElementById('twinAvatar');
        const status = document.getElementById('twinStatus');
        
        avatar.className = 'twin-avatar stressed';
        status.textContent = '⚠️ Phát hiện stress - Đề xuất nghỉ 2 phút';
        energy = Math.max(0, energy - 5);
        document.getElementById('twinEnergy').textContent = energy + '%';
        
        setTimeout(() => {
            avatar.className = 'twin-avatar idle';
            status.textContent = 'Hệ thống đồng bộ ổn định';
        }, 2000);
        
        addXP(5);
    }

    function addXP(amount) {
        xp += amount;
        const xpNeeded = level * 100;
        if (xp >= xpNeeded) {
            level++;
            xp = xp - xpNeeded;
            document.getElementById('twinLevel').textContent = `Lv.${level}`;
        }
        document.getElementById('twinXP').textContent = `${xp}/${level * 100}`;
    }

    // ============================================
    // BIOMETRICS ANIMATION
    // ============================================
    function startBiometricsAnimation() {
        if (biometricsInterval) clearInterval(biometricsInterval);
        biometricsInterval = setInterval(() => {
            const heartElem = document.getElementById('heartRate');
            const focusElem = document.getElementById('focusLevel');
            const burnoutElem = document.getElementById('burnoutRisk');
            
            let heart = parseInt(heartElem.textContent);
            let focus = parseInt(focusElem.textContent);
            let burnout = parseInt(burnoutElem.textContent);
            
            // Dao động nhẹ
            heart += Math.floor(Math.random() * 3) - 1; // -1,0,1
            focus += Math.floor(Math.random() * 3) - 1;
            
            // Giới hạn
            heart = Math.max(60, Math.min(100, heart));
            focus = Math.max(60, Math.min(100, focus));
            
            heartElem.textContent = heart + ' bpm';
            focusElem.textContent = focus + '%';
            
            // Tính burnout risk dựa trên streak và năng lượng
            burnout = Math.min(100, streak * 5 + (100 - energy) * 0.5 + (heart - 70) * 0.5);
            burnout = Math.max(0, Math.floor(burnout));
            burnoutElem.textContent = burnout + '%';
            
            // Nếu burnout > 50, twin cảnh báo
            if (burnout > 50) {
                document.getElementById('twinStatus').textContent = '⚠️ Bạn cần nghỉ ngơi!';
                document.getElementById('twinAvatar').className = 'twin-avatar stressed';
            } else {
                document.getElementById('twinStatus').textContent = 'Hệ thống đồng bộ ổn định';
                document.getElementById('twinAvatar').className = 'twin-avatar idle';
            }
        }, 3000);
    }

    // ============================================
    // KNOWLEDGE GRAPH (có thể click)
    // ============================================
    function updateKnowledgeGraph(subject) {
        const container = document.getElementById('graphContainer');
        if (!container) return;
        
        const data = subjectData[subject];
        
        container.innerHTML = '';
        
        const mastered = ['Kiến thức cơ bản', 'Lý thuyết nền'];
        mastered.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node mastered';
            node.textContent = `✅ ${skill}`;
            container.appendChild(node);
        });
        
        const improving = ['Bài tập vận dụng'];
        improving.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node improving';
            node.textContent = `📈 ${skill}`;
            container.appendChild(node);
        });
        
        data.weaknesses.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node weak';
            node.textContent = `⚠️ ${skill}`;
            node.onclick = () => showRoadmapPopup(skill);
            container.appendChild(node);
        });
    }

    async function showRoadmapPopup(skill) {
        const modal = document.getElementById('roadmapPopup');
        const content = document.getElementById('popupContent');
        content.textContent = 'Đang tải lộ trình...';
        modal.classList.add('show');
        
        const data = subjectData[currentSubject];
        const prompt = `Hãy tạo một lộ trình học cấp tốc cho kỹ năng "${skill}" trong môn ${data.name}. Gồm 3-5 bước ngắn gọn, dễ hiểu.`;
        const roadmap = await callGemini(prompt);
        content.innerHTML = roadmap.replace(/\n/g, '<br>');
    }

    // ============================================
    // AI TUTOR CHAT
    // ============================================
    async function handleChat() {
        const input = document.getElementById('searchInput');
        const question = input.value.trim();
        if (!question) return;

        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML += `<div class="chat-message"><b>🧑 Bạn:</b> ${question}</div>`;
        input.value = '';

        const data = subjectData[currentSubject];
        const prompt = `Học sinh hỏi: "${question}" trong môn ${data.name}. Hãy trả lời ngắn gọn, hữu ích.`;
        const answer = await callGemini(prompt);
        chatBox.innerHTML += `<div class="chat-message ai-message"><b>AI:</b> ${answer}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        addXP(2);
    }

    // ============================================
    // MODAL CÀI ĐẶT API
    // ============================================
    function setupApiModal() {
        const modal = document.getElementById('apiModal');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const saveBtn = document.getElementById('saveApiBtn');
        const apiInput = document.getElementById('apiKeyInput');

        settingsBtn.addEventListener('click', () => {
            apiInput.value = getApiKey() || '';
            modal.classList.add('show');
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        saveBtn.addEventListener('click', () => {
            const key = apiInput.value.trim();
            if (key) {
                localStorage.setItem('gemini_api_key', key);
                alert('Đã lưu API key!');
                modal.classList.remove('show');
                // Reload để dùng key mới
                location.reload();
            } else {
                alert('Vui lòng nhập key');
            }
        });

        // Click ngoài modal để đóng
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    // ============================================
    // KHỞI TẠO VÀ SỰ KIỆN
    // ============================================
    function init() {
        console.log('Khởi động AI Study Twin...');
        
        // Load dữ liệu từ localStorage
        const savedStreak = Storage.load('streak', { streak: 0, lastStudyDate: null });
        streak = savedStreak.streak;
        lastStudyDate = savedStreak.lastStudyDate;
        document.getElementById('streakBadge').textContent = `🔥 ${streak} ngày`;

        scheduleItems = Storage.load('schedule', [
            { subject: '📘 Tiếng Anh', time: '08:00 - 09:30', completed: false },
            { subject: '📐 Toán', time: '09:45 - 11:15', completed: false }
        ]);
        renderSchedule();

        // Khởi tạo biểu đồ
        initChart(currentSubject);
        
        // Cập nhật insight ban đầu
        updateDailyInsight();

        // Subject selector
        document.getElementById('subjectSelector').addEventListener('change', (e) => {
            currentSubject = e.target.value;
            initChart(currentSubject);
            updateDailyInsight();
            updateKnowledgeGraph(currentSubject);
        });

        // Chat
        document.getElementById('searchBtn').addEventListener('click', handleChat);
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });

        // Thêm lịch học
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            const subject = document.getElementById('subjectInput').value.trim();
            const time = document.getElementById('timeSelect').value;
            if (subject) addScheduleItem(subject, time);
        });

        // AI tạo lịch
        document.getElementById('generateScheduleBtn').addEventListener('click', generateAISchedule);

        // Twin click
        document.getElementById('twinAvatar').addEventListener('click', handleTwinClick);

        // Cập nhật điểm
        document.getElementById('updateScoreBtn').addEventListener('click', async () => {
            const input = document.getElementById('newScoreInput');
            const score = parseFloat(input.value);
            if (isNaN(score) || score < 0 || score > 10) {
                alert('Vui lòng nhập điểm từ 0 đến 10');
                return;
            }
            await addNewScore(score);
            input.value = '';
            updateStreak();
        });

        // Biometrics animation
        startBiometricsAnimation();

        // Knowledge Graph ban đầu
        updateKnowledgeGraph(currentSubject);

        // Đóng popup roadmap
        document.getElementById('closePopupBtn').addEventListener('click', () => {
            document.getElementById('roadmapPopup').classList.remove('show');
        });

        // Cài đặt modal API
        setupApiModal();

        // Kiểm tra ca học mỗi phút
        setInterval(checkActiveSession, 60000);
        checkActiveSession();
    }

    // Public API
    return {
        init,
        handleDrop,
        deleteScheduleItem: (index) => deleteScheduleItem(index),
    };
})();

// Khởi động khi trang load
window.addEventListener('load', () => App.init());
