// ===== APP MODULE =====
const App = (function() {
    // Private variables
    let chart = null;
    let currentSubject = 'english';
    let twinState = 'idle';
    let xp = 0;
    let level = 1;
    
    // Subject data
    const subjectData = {
        math: {
            name: 'Toán',
            icon: '📐',
            real: [6.5, 7.0, 7.2, 7.8],
            predicted: [7.8, 8.2, 8.5],
            weaknesses: ['Hình học', 'Tích phân', 'Số phức'],
            tip: '🔢 Ôn lại chuyên đề Vector. Cần luyện thêm bài tập nâng cao.'
        },
        english: {
            name: 'Tiếng Anh',
            icon: '📘',
            real: [7.0, 7.3, 7.8, 8.1],
            predicted: [8.1, 8.5, 8.9],
            weaknesses: ['Từ vựng', 'Phrasal verbs', 'Writing'],
            tip: '📘 Bạn hay quên từ vựng sau 3 ngày. Hệ thống kích hoạt Spaced Repetition.'
        },
        physics: {
            name: 'Vật Lý',
            icon: '⚡',
            real: [6.0, 6.8, 7.5, 7.9],
            predicted: [7.9, 8.1, 8.3],
            weaknesses: ['Điện từ', 'Lượng tử', 'Dao động'],
            tip: '⚡ Sai số trong bài động lượng đang tăng. Cần luyện thêm.'
        },
        chemistry: {
            name: 'Hóa Học',
            icon: '🧪',
            real: [7.2, 7.5, 7.9, 8.3],
            predicted: [8.3, 8.5, 8.7],
            weaknesses: ['Hóa hữu cơ', 'Phản ứng oxi hóa khử'],
            tip: '🧪 Phản ứng oxi hóa khử còn yếu. Đề xuất làm thêm bài tập.'
        },
        biology: {
            name: 'Sinh Học',
            icon: '🧬',
            real: [7.5, 7.8, 8.0, 8.2],
            predicted: [8.2, 8.4, 8.6],
            weaknesses: ['Tế bào', 'Di truyền'],
            tip: '🧬 Cần ôn lại cấu trúc tế bào.'
        },
        literature: {
            name: 'Ngữ Văn',
            icon: '📖',
            real: [7.0, 7.3, 7.6, 7.8],
            predicted: [7.8, 8.0, 8.2],
            weaknesses: ['Nghị luận', 'Phân tích thơ'],
            tip: '📖 Phân tích tác phẩm còn sơ sài.'
        },
        history: {
            name: 'Lịch Sử',
            icon: '🏛️',
            real: [7.8, 8.0, 8.2, 8.5],
            predicted: [8.5, 8.7, 8.9],
            weaknesses: ['Mốc thời gian', 'Sự kiện'],
            tip: '🏛️ Hay nhầm mốc thời gian. Kích hoạt ghi nhớ timeline.'
        },
        geography: {
            name: 'Địa Lý',
            icon: '🌍',
            real: [7.4, 7.7, 8.0, 8.3],
            predicted: [8.3, 8.5, 8.7],
            weaknesses: ['Bản đồ', 'Kinh tế'],
            tip: '🌍 Bản đồ các vùng kinh tế còn lúng túng.'
        },
        civics: {
            name: 'GDCD',
            icon: '🤝',
            real: [8.0, 8.2, 8.4, 8.6],
            predicted: [8.6, 8.8, 9.0],
            weaknesses: ['Pháp luật', 'Đạo đức'],
            tip: '🤝 Cần liên hệ thực tế nhiều hơn.'
        },
        informatics: {
            name: 'Tin Học',
            icon: '💻',
            real: [7.9, 8.1, 8.3, 8.5],
            predicted: [8.5, 8.7, 8.9],
            weaknesses: ['Thuật toán', 'Cấu trúc dữ liệu'],
            tip: '💻 Thuật toán sắp xếp còn sai.'
        },
        technology: {
            name: 'Công Nghệ',
            icon: '🔧',
            real: [7.3, 7.6, 7.9, 8.2],
            predicted: [8.2, 8.4, 8.6],
            weaknesses: ['Bản vẽ', 'Vật liệu'],
            tip: '🔧 Bản vẽ kỹ thuật chưa chính xác.'
        }
    };

    // Initialize chart
    function initChart(subject) {
        const ctx = document.getElementById('roadmapChart');
        if (!ctx) return;
        
        if (chart) chart.destroy();
        
        const data = subjectData[subject];
        if (!data) return;
        
        const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Dự báo 1', 'Dự báo 2'];
        const realData = [...data.real, null, null];
        const predData = [null, null, null, data.real[3], data.predicted[1], data.predicted[2]];
        
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
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Dự báo',
                        data: predData,
                        borderColor: '#9d4edd',
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointBackgroundColor: '#9d4edd',
                        pointBorderColor: '#fff',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 5,
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
        
        // Update stats
        updateStats(data);
    }
    
    // Update stats
    function updateStats(data) {
        document.getElementById('statReal').textContent = data.real[data.real.length - 1].toFixed(1);
        document.getElementById('statPred').textContent = data.predicted[data.predicted.length - 1].toFixed(1);
        document.getElementById('statGoal').textContent = (data.predicted[data.predicted.length - 1] + 0.3).toFixed(1);
        document.getElementById('currentGPA').textContent = data.real[data.real.length - 1].toFixed(1);
    }
    
    // Update insight
    function updateInsight(subject) {
        const data = subjectData[subject];
        document.getElementById('dailyTip').textContent = data.tip;
        document.getElementById('currentSubjectContext').textContent = data.name;
        document.getElementById('weakSkillContext').textContent = data.weaknesses[0];
    }
    
    // Update knowledge graph
    function updateKnowledgeGraph(subject) {
        const container = document.getElementById('graphContainer');
        if (!container) return;
        
        const data = subjectData[subject];
        const weaknesses = data.weaknesses;
        
        container.innerHTML = '';
        
        // Add mastered skills (giả định)
        const mastered = ['Kiến thức cơ bản', 'Lý thuyết nền'];
        mastered.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node mastered';
            node.textContent = `✅ ${skill}`;
            container.appendChild(node);
        });
        
        // Add improving skills
        const improving = ['Bài tập vận dụng'];
        improving.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node improving';
            node.textContent = `📈 ${skill}`;
            container.appendChild(node);
        });
        
        // Add weak skills
        weaknesses.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node weak';
            node.textContent = `⚠️ ${skill}`;
            node.onclick = () => {
                document.getElementById('searchInput').value = `Học ${skill} như thế nào?`;
                document.getElementById('searchBtn').click();
            };
            container.appendChild(node);
        });
    }
    
    // Update twin state
    function updateTwinState(state) {
        const avatar = document.getElementById('twinAvatar');
        const status = document.getElementById('twinStatus');
        
        avatar.className = `twin-avatar ${state}`;
        
        const states = {
            idle: { text: 'Hệ thống đồng bộ ổn định' },
            learning: { text: 'Đang học - Tập trung cao độ' },
            stressed: { text: 'Phát hiện stress - Đề xuất nghỉ ngơi' },
            improving: { text: 'Đang cải thiện - Rất tốt!' }
        };
        
        status.textContent = states[state]?.text || states.idle.text;
    }
    
    // Add XP
    function addXP(amount) {
        xp += amount;
        const xpNeeded = level * 100;
        
        if (xp >= xpNeeded) {
            level++;
            xp = xp - xpNeeded;
        }
        
        document.getElementById('twinXP').textContent = `${xp}/${level * 100}`;
        document.getElementById('twinLevel').textContent = `Lv.${level}`;
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Subject selector
        const selector = document.getElementById('subjectSelector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                currentSubject = e.target.value;
                initChart(currentSubject);
                updateInsight(currentSubject);
                updateKnowledgeGraph(currentSubject);
                addXP(5); // Thêm XP khi đổi môn
            });
        }
        
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const question = searchInput.value.trim();
                if (!question) return;
                
                const chatBox = document.getElementById('chatBox');
                const subject = subjectData[currentSubject];
                
                chatBox.innerHTML += `<div class="chat-message"><b>🧑 Bạn:</b> ${question}</div>`;
                
                // AI response
                setTimeout(() => {
                    let response = '';
                    if (question.toLowerCase().includes('từ vựng')) {
                        response = `📘 Về từ vựng Tiếng Anh, bạn nên học theo chủ đề và sử dụng spaced repetition. Môn ${subject.name} hiện tại đang yếu nhất ở: ${subject.weaknesses.join(', ')}.`;
                    } else {
                        response = `🤖 Phân tích lỗi sai và đề xuất phương pháp First Principles... Môn ${subject.name} cần
