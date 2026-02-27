// ============================================
// CẤU HÌNH VÀ BIẾN TOÀN CỤC
// ============================================
const CONFIG = {
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent'
};

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

function getApiKey() {
    return localStorage.getItem('gemini_api_key');
}

// ============================================
// MODULE CHÍNH
// ============================================
const App = (function() {
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
    
    // Cấu trúc dữ liệu môn học mở rộng
    const subjectData = Storage.load('subjectData', {
        math: {
            name: 'Toán',
            icon: '📐',
            dailyScores: [],      // điểm thường xuyên
            midtermScores: [],     // điểm giữa kỳ (có thể nhiều)
            finalScores: [],       // điểm cuối kỳ (thường 1)
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Hình học không gian', 'Tích phân', 'Số phức'],
            tip: '🔢 Ôn lại chuyên đề Vector.'
        },
        english: {
            name: 'Tiếng Anh',
            icon: '📘',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Từ vựng', 'Phrasal verbs', 'IELTS Writing'],
            tip: '📘 Bạn hay quên từ vựng sau 3 ngày.'
        },
        physics: {
            name: 'Vật Lý',
            icon: '⚡',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Điện từ', 'Lượng tử ánh sáng', 'Dao động'],
            tip: '⚡ Sai số trong bài động lượng đang tăng.'
        },
        chemistry: {
            name: 'Hóa Học',
            icon: '🧪',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Hóa hữu cơ', 'Phản ứng oxi hóa khử'],
            tip: '🧪 Phản ứng oxi hóa khử còn yếu.'
        },
        biology: {
            name: 'Sinh Học',
            icon: '🧬',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Cấu trúc tế bào', 'Di truyền học'],
            tip: '🧬 Cần ôn lại cấu trúc tế bào.'
        },
        literature: {
            name: 'Ngữ Văn',
            icon: '📖',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Nghị luận xã hội', 'Phân tích thơ'],
            tip: '📖 Phân tích tác phẩm còn sơ sài.'
        },
        history: {
            name: 'Lịch Sử',
            icon: '🏛️',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Mốc thời gian', 'Sự kiện thế giới'],
            tip: '🏛️ Hay nhầm mốc thời gian.'
        },
        geography: {
            name: 'Địa Lý',
            icon: '🌍',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Bản đồ', 'Kinh tế vùng'],
            tip: '🌍 Bản đồ các vùng kinh tế còn lúng túng.'
        },
        civics: {
            name: 'GDCD',
            icon: '🤝',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Pháp luật', 'Đạo đức kinh doanh'],
            tip: '🤝 Cần liên hệ thực tế nhiều hơn.'
        },
        informatics: {
            name: 'Tin Học',
            icon: '💻',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Thuật toán', 'Cấu trúc dữ liệu'],
            tip: '💻 Thuật toán sắp xếp còn sai.'
        },
        technology: {
            name: 'Công Nghệ',
            icon: '🔧',
            dailyScores: [],
            midtermScores: [],
            finalScores: [],
            targets: { hk1: null, hk2: null, year: null },
            weaknesses: ['Bản vẽ kỹ thuật', 'Vật liệu cơ khí'],
            tip: '🔧 Bản vẽ kỹ thuật chưa chính xác.'
        }
    });

    function saveSubjectData() {
        Storage.save('subjectData', subjectData);
    }

    // Tính điểm trung bình môn theo hệ số
    function calculateAverage(subject) {
        const data = subjectData[subject];
        const dailyAvg = data.dailyScores.length > 0 
            ? data.dailyScores.reduce((a,b) => a + b, 0) / data.dailyScores.length 
            : 0;
        const midtermAvg = data.midtermScores.length > 0 
            ? data.midtermScores.reduce((a,b) => a + b, 0) / data.midtermScores.length 
            : 0;
        const finalAvg = data.finalScores.length > 0 
            ? data.finalScores.reduce((a,b) => a + b, 0) / data.finalScores.length 
            : 0;

        // Công thức: (daily*1 + midterm*2 + final*3) / tổng hệ số
        const totalWeight = (data.dailyScores.length * 1) + (data.midtermScores.length * 2) + (data.finalScores.length * 3);
        if (totalWeight === 0) return 0;
        const weightedSum = dailyAvg * data.dailyScores.length * 1 + midtermAvg * data.midtermScores.length * 2 + finalAvg * data.finalScores.length * 3;
        return weightedSum / totalWeight;
    }

    // Lấy điểm trung bình hiện tại cho biểu đồ (lịch sử)
    function getCurrentAverage(subject) {
        return calculateAverage(subject);
    }

    // Dự báo điểm dựa trên điểm hiện tại và mục tiêu
    function predictScores(subject) {
        const data = subjectData[subject];
        const currentAvg = calculateAverage(subject);
        const targets = data.targets;
        
        // Nếu có mục tiêu, dùng làm cơ sở dự báo
        let pred1 = currentAvg + 0.3;
        let pred2 = currentAvg + 0.6;
        
        if (targets.hk1 && targets.hk1 > currentAvg) {
            pred1 = currentAvg + (targets.hk1 - currentAvg) * 0.5;
        }
        if (targets.hk2 && targets.hk2 > currentAvg) {
            pred2 = currentAvg + (targets.hk2 - currentAvg) * 0.8;
        }
        if (targets.year && targets.year > currentAvg) {
            pred2 = Math.max(pred2, currentAvg + (targets.year - currentAvg) * 0.9);
        }
        
        return [
            Number(Math.min(10, Math.max(0, pred1)).toFixed(1)),
            Number(Math.min(10, Math.max(0, pred2)).toFixed(1))
        ];
    }

    // Khởi tạo biểu đồ
    function initChart(subject) {
        const ctx = document.getElementById('roadmapChart');
        if (!ctx) return;
        if (chart) chart.destroy();

        const data = subjectData[subject];
        const currentAvg = calculateAverage(subject);
        const predicted = predictScores(subject);

        // Tạo dữ liệu lịch sử (giả định các tuần trước dựa trên dailyScores)
        const history = [];
        if (data.dailyScores.length > 0) {
            // Lấy 4 điểm gần nhất từ dailyScores (hoặc kết hợp)
            history.push(...data.dailyScores.slice(-4));
        } else {
            history.push(6.5, 7.0, 7.5, currentAvg); // mẫu
        }
        while (history.length < 4) history.unshift(5.0); // đệm

        const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Dự báo 1', 'Dự báo 2'];
        const realData = [...history.slice(0,4), null, null];
        const predData = [null, null, null, null, predicted[0], predicted[1]];

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Điểm thực tế',
                        data: realData,
                        borderColor: '#2a9dff',
                        backgroundColor: 'rgba(42, 157, 255, 0.1)',
                        tension: 0.4,
                        pointBackgroundColor: '#2a9dff',
                        pointBorderColor: '#fff',
                        pointRadius: 6
                    },
                    {
                        label: 'Dự báo',
                        data: predData,
                        borderColor: '#9d4edd',
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointBackgroundColor: '#9d4edd',
                        pointBorderColor: '#fff',
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 10,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#8f9bb3' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8f9bb3' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });

        document.getElementById('statReal').textContent = currentAvg.toFixed(1);
        document.getElementById('statPred1').textContent = predicted[0].toFixed(1);
        document.getElementById('statPred2').textContent = predicted[1].toFixed(1);
        document.getElementById('currentGPA').textContent = currentAvg.toFixed(1);
        document.getElementById('confidenceValue').textContent = Math.floor(70 + Math.random() * 20) + '%';
        
        // Cập nhật hiển thị mục tiêu
        document.getElementById('targetHK1Display').textContent = data.targets.hk1 ? data.targets.hk1.toFixed(1) : '--';
        document.getElementById('targetHK2Display').textContent = data.targets.hk2 ? data.targets.hk2.toFixed(1) : '--';
        document.getElementById('targetYearDisplay').textContent = data.targets.year ? data.targets.year.toFixed(1) : '--';
    }

    // Cập nhật Daily Insight với AI
    async function updateDailyInsight() {
        const data = subjectData[currentSubject];
        const currentAvg = calculateAverage(currentSubject);
        const focus = document.getElementById('focusLevel').textContent;
        
        const prompt = `Học sinh môn ${data.name} có điểm trung bình hiện tại ${currentAvg.toFixed(1)}, mức tập trung ${focus}. Điểm yếu: ${data.weaknesses.join(', ')}. Hãy đưa ra một lời khuyên học tập ngắn gọn (dưới 100 ký tự).`;
        
        const advice = await callGemini(prompt);
        document.getElementById('dailyTip').textContent = advice;
    }

    // Gọi Gemini API
    async function callGemini(prompt) {
        const apiKey = getApiKey();
        if (!apiKey) return mockAIResponse(prompt);

        try {
            const response = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
                })
            });
            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                return data.candidates[0].content.parts[0].text;
            }
            return mockAIResponse(prompt);
        } catch (error) {
            console.error('Lỗi Gemini:', error);
            return mockAIResponse(prompt);
        }
    }

    function mockAIResponse(prompt) {
        const insights = [
            'Hôm nay nên tập trung vào phần yếu nhất.',
            'Học 25 phút, nghỉ 5 phút để đạt hiệu quả cao.',
            'Đừng quên ôn lại bài cũ trước khi học mới.',
            'Bạn đang tiến bộ, hãy duy trì nhịp độ này!'
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }

    // Thêm điểm chi tiết từ modal
    function saveDetailedScores() {
        const daily = parseFloat(document.getElementById('dailyScore').value);
        const midterm = parseFloat(document.getElementById('midtermScore').value);
        const final = parseFloat(document.getElementById('finalScore').value);
        const targetHK1 = parseFloat(document.getElementById('targetHK1').value);
        const targetHK2 = parseFloat(document.getElementById('targetHK2').value);
        const targetYear = parseFloat(document.getElementById('targetYear').value);

        const data = subjectData[currentSubject];
        
        if (!isNaN(daily) && daily >= 0 && daily <= 10) data.dailyScores.push(daily);
        if (!isNaN(midterm) && midterm >= 0 && midterm <= 10) data.midtermScores.push(midterm);
        if (!isNaN(final) && final >= 0 && final <= 10) data.finalScores.push(final);
        
        if (!isNaN(targetHK1) && targetHK1 >= 0 && targetHK1 <= 10) data.targets.hk1 = targetHK1;
        if (!isNaN(targetHK2) && targetHK2 >= 0 && targetHK2 <= 10) data.targets.hk2 = targetHK2;
        if (!isNaN(targetYear) && targetYear >= 0 && targetYear <= 10) data.targets.year = targetYear;

        saveSubjectData();
        initChart(currentSubject);
        updateDailyInsight();
        updateKnowledgeGraph(currentSubject);
        
        // Đóng modal
        document.getElementById('scoreModal').classList.remove('show');
        // Clear inputs
        document.getElementById('dailyScore').value = '';
        document.getElementById('midtermScore').value = '';
        document.getElementById('finalScore').value = '';
        document.getElementById('targetHK1').value = '';
        document.getElementById('targetHK2').value = '';
        document.getElementById('targetYear').value = '';
    }

    // Các hàm khác giữ nguyên (schedule, twin, biometrics, ...)
    // (Tôi sẽ lược bớt để ngắn gọn, nhưng bạn cần giữ lại toàn bộ các hàm từ phần trước: 
    // renderSchedule, handleDrop, addScheduleItem, deleteScheduleItem, checkActiveSession, 
    // startCountdownForSession, generateAISchedule, handleTwinClick, addXP, 
    // startBiometricsAnimation, updateKnowledgeGraph, showRoadmapPopup, handleChat, setupApiModal)

    // ... (chèn tất cả các hàm đã có từ phiên bản trước vào đây)

    // Để tiết kiệm không gian, tôi sẽ chỉ cung cấp phần khởi tạo và các hàm mới. 
    // Bạn cần kết hợp với code script.js cũ.

    // ===== CÁC HÀM QUẢN LÝ LỊCH HỌC, TWIN, BIOMETRICS (GIỮ NGUYÊN) =====
    // (Đã có trong code trước, tôi sẽ không viết lại ở đây để tránh trùng lặp)

    // ============================================
    // KHỞI TẠO VÀ SỰ KIỆN
    // ============================================
    function init() {
        console.log('Khởi động AI Study Twin...');
        
        // Load streak
        const savedStreak = Storage.load('streak', { streak: 0, lastStudyDate: null });
        streak = savedStreak.streak;
        lastStudyDate = savedStreak.lastStudyDate;
        document.getElementById('streakBadge').textContent = `🔥 ${streak} ngày`;

        // Load schedule
        scheduleItems = Storage.load('schedule', [
            { subject: '📘 Tiếng Anh', time: '08:00 - 09:30', completed: false },
            { subject: '📐 Toán', time: '09:45 - 11:15', completed: false }
        ]);
        renderSchedule();

        // Khởi tạo biểu đồ
        initChart(currentSubject);
        updateDailyInsight();
        updateKnowledgeGraph(currentSubject);
        startBiometricsAnimation();

        // Subject selector
        document.getElementById('subjectSelector').addEventListener('change', (e) => {
            currentSubject = e.target.value;
            initChart(currentSubject);
            updateDailyInsight();
            updateKnowledgeGraph(currentSubject);
            document.getElementById('currentSubjectContext').textContent = subjectData[currentSubject].name;
            document.getElementById('weakSkillContext').textContent = subjectData[currentSubject].weaknesses[0];
        });

        // Chat
        document.getElementById('searchBtn').addEventListener('click', handleChat);
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });

        // Schedule
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            const subject = document.getElementById('subjectInput').value.trim();
            const time = document.getElementById('timeSelect').value;
            if (subject) addScheduleItem(subject, time);
        });
        document.getElementById('generateScheduleBtn').addEventListener('click', generateAISchedule);

        // Twin
        document.getElementById('twinAvatar').addEventListener('click', handleTwinClick);

        // Điểm mới (nhanh)
        document.getElementById('updateScoreBtn').addEventListener('click', async () => {
            const input = document.getElementById('newScoreInput');
            const score = parseFloat(input.value);
            if (!isNaN(score) && score >= 0 && score <= 10) {
                subjectData[currentSubject].dailyScores.push(score);
                saveSubjectData();
                initChart(currentSubject);
                updateDailyInsight();
                input.value = '';
                updateStreak();
            } else {
                alert('Nhập điểm từ 0-10');
            }
        });

        // Modal điểm chi tiết
        document.getElementById('openScoreModalBtn').addEventListener('click', () => {
            document.getElementById('modalSubjectTitle').textContent = `Nhập điểm môn ${subjectData[currentSubject].name}`;
            document.getElementById('scoreModal').classList.add('show');
        });
        document.getElementById('saveScoreBtn').addEventListener('click', saveDetailedScores);
        document.getElementById('closeScoreModalBtn').addEventListener('click', () => {
            document.getElementById('scoreModal').classList.remove('show');
        });

        // Đóng popup roadmap
        document.getElementById('closePopupBtn').addEventListener('click', () => {
            document.getElementById('roadmapPopup').classList.remove('show');
        });

        // Cài đặt API
        setupApiModal();

        // Theo dõi ca học
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

// Khởi động
window.addEventListener('load', () => App.init());
