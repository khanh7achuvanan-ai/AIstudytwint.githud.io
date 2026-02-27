// App Module - Tất cả chức năng chính
const App = (function() {
    // Private variables
    let chart = null;
    let currentSubject = 'english';
    let xp = 0;
    let level = 1;
    
    // Dữ liệu cho 11 môn học
    const subjectData = {
        math: {
            name: 'Toán',
            icon: '📐',
            real: [6.5, 7.0, 7.2, 7.8],
            predicted: [7.8, 8.2, 8.5],
            weaknesses: ['Hình học không gian', 'Tích phân', 'Số phức'],
            tip: '🔢 Ôn lại chuyên đề Vector. Cần luyện thêm bài tập nâng cao.'
        },
        english: {
            name: 'Tiếng Anh',
            icon: '📘',
            real: [7.0, 7.3, 7.8, 8.1],
            predicted: [8.1, 8.5, 8.9],
            weaknesses: ['Từ vựng', 'Phrasal verbs', 'IELTS Writing'],
            tip: '📘 Bạn hay quên từ vựng sau 3 ngày. Hệ thống kích hoạt Spaced Repetition.'
        },
        physics: {
            name: 'Vật Lý',
            icon: '⚡',
            real: [6.0, 6.8, 7.5, 7.9],
            predicted: [7.9, 8.1, 8.3],
            weaknesses: ['Điện từ', 'Lượng tử ánh sáng', 'Dao động'],
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
            weaknesses: ['Cấu trúc tế bào', 'Di truyền học'],
            tip: '🧬 Cần ôn lại cấu trúc tế bào.'
        },
        literature: {
            name: 'Ngữ Văn',
            icon: '📖',
            real: [7.0, 7.3, 7.6, 7.8],
            predicted: [7.8, 8.0, 8.2],
            weaknesses: ['Nghị luận xã hội', 'Phân tích thơ'],
            tip: '📖 Phân tích tác phẩm còn sơ sài.'
        },
        history: {
            name: 'Lịch Sử',
            icon: '🏛️',
            real: [7.8, 8.0, 8.2, 8.5],
            predicted: [8.5, 8.7, 8.9],
            weaknesses: ['Mốc thời gian', 'Sự kiện thế giới'],
            tip: '🏛️ Hay nhầm mốc thời gian. Kích hoạt ghi nhớ timeline.'
        },
        geography: {
            name: 'Địa Lý',
            icon: '🌍',
            real: [7.4, 7.7, 8.0, 8.3],
            predicted: [8.3, 8.5, 8.7],
            weaknesses: ['Bản đồ', 'Kinh tế vùng'],
            tip: '🌍 Bản đồ các vùng kinh tế còn lúng túng.'
        },
        civics: {
            name: 'GDCD',
            icon: '🤝',
            real: [8.0, 8.2, 8.4, 8.6],
            predicted: [8.6, 8.8, 9.0],
            weaknesses: ['Pháp luật', 'Đạo đức kinh doanh'],
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
            weaknesses: ['Bản vẽ kỹ thuật', 'Vật liệu cơ khí'],
            tip: '🔧 Bản vẽ kỹ thuật chưa chính xác.'
        }
    };

    // Khởi tạo chart
    function initChart(subject) {
        const ctx = document.getElementById('roadmapChart');
        if (!ctx) return;
        
        if (chart) {
            chart.destroy();
        }
        
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
        const statReal = document.getElementById('statReal');
        const statPred = document.getElementById('statPred');
        const statGoal = document.getElementById('statGoal');
        const currentGPA = document.getElementById('currentGPA');
        
        if (statReal) statReal.textContent = data.real[data.real.length - 1].toFixed(1);
        if (statPred) statPred.textContent = data.predicted[data.predicted.length - 1].toFixed(1);
        if (statGoal) statGoal.textContent = (data.predicted[data.predicted.length - 1] + 0.3).toFixed(1);
        if (currentGPA) currentGPA.textContent = data.real[data.real.length - 1].toFixed(1);
    }
    
    // Update insight
    function updateInsight(subject) {
        const data = subjectData[subject];
        const dailyTip = document.getElementById('dailyTip');
        const currentSubjectContext = document.getElementById('currentSubjectContext');
        const weakSkillContext = document.getElementById('weakSkillContext');
        
        if (dailyTip) dailyTip.textContent = data.tip;
        if (currentSubjectContext) currentSubjectContext.textContent = data.name;
        if (weakSkillContext) weakSkillContext.textContent = data.weaknesses[0];
    }
    
    // Update knowledge graph
    function updateKnowledgeGraph(subject) {
        const container = document.getElementById('graphContainer');
        if (!container) return;
        
        const data = subjectData[subject];
        
        container.innerHTML = '';
        
        // Mastered skills
        const mastered = ['Kiến thức cơ bản', 'Lý thuyết nền'];
        mastered.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node mastered';
            node.textContent = `✅ ${skill}`;
            container.appendChild(node);
        });
        
        // Improving skills
        const improving = ['Bài tập vận dụng'];
        improving.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node improving';
            node.textContent = `📈 ${skill}`;
            container.appendChild(node);
        });
        
        // Weak skills
        data.weaknesses.forEach(skill => {
            const node = document.createElement('span');
            node.className = 'skill-node weak';
            node.textContent = `⚠️ ${skill}`;
            node.onclick = () => {
                const searchInput = document.getElementById('searchInput');
                const searchBtn = document.getElementById('searchBtn');
                if (searchInput && searchBtn) {
                    searchInput.value = `Làm thế nào để học ${skill}?`;
                    searchBtn.click();
                }
            };
            container.appendChild(node);
        });
    }
    
    // Thêm XP
    function addXP(amount) {
        xp += amount;
        const xpNeeded = level * 100;
        
        if (xp >= xpNeeded) {
            level++;
            xp = xp - xpNeeded;
            const twinLevel = document.getElementById('twinLevel');
            if (twinLevel) twinLevel.textContent = `Lv.${level}`;
        }
        
        const twinXP = document.getElementById('twinXP');
        if (twinXP) twinXP.textContent = `${xp}/${level * 100}`;
    }
    
    // Handle twin click
    function handleTwinClick() {
        const avatar = document.getElementById('twinAvatar');
        const status = document.getElementById('twinStatus');
        
        if (avatar && status) {
            avatar.className = 'twin-avatar stressed';
            status.textContent = '⚠️ Phát hiện stress - Đề xuất nghỉ 2 phút';
            
            setTimeout(() => {
                avatar.className = 'twin-avatar idle';
                status.textContent = 'Hệ thống đồng bộ ổn định';
                addXP(10);
            }, 2000);
        }
    }
    
    // Public methods
    return {
        // Khởi tạo app
        init: function() {
            console.log('App initializing...');
            
            // Đợi DOM load xong
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },
        
        // Setup tất cả
        setup: function() {
            console.log('Setting up app...');
            
            // Khởi tạo chart với mặc định
            initChart(currentSubject);
            updateInsight(currentSubject);
            updateKnowledgeGraph(currentSubject);
            
            // Subject selector
            const selector = document.getElementById('subjectSelector');
            if (selector) {
                selector.addEventListener('change', (e) => {
                    currentSubject = e.target.value;
                    initChart(currentSubject);
                    updateInsight(currentSubject);
                    updateKnowledgeGraph(currentSubject);
                    addXP(5);
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
                    const data = subjectData[currentSubject];
                    
                    if (chatBox) {
                        chatBox.innerHTML += `<div class="chat-message"><b>🧑 Bạn:</b> ${question}</div>`;
                        
                        // AI response
                        setTimeout(() => {
                            let response = '';
                            if (question.toLowerCase().includes('từ vựng')) {
                                response = `📘 Về từ vựng, bạn nên học theo chủ đề. Môn ${data.name} đang yếu nhất ở: ${data.weaknesses.join(', ')}.`;
                            } else if (question.toLowerCase().includes('công thức')) {
                                response = `📐 Công thức quan trọng của môn ${data.name} cần nhớ: Hãy học theo sơ đồ tư duy.`;
                            } else {
                                response = `🤖 Dựa trên dữ liệu học tập, tôi đề xuất bạn tập trung vào "${data.weaknesses[0]}" trước. Bạn muốn tôi giải thích chi tiết không?`;
                            }
                            
                            chatBox.innerHTML += `<div class="chat-message ai-message"><b>AI:</b> ${response}</div>`;
                            chatBox.scrollTop = chatBox.scrollHeight;
                            
                            // Thêm XP khi tương tác
                            addXP(2);
                        }, 500);
                        
                        searchInput.value = '';
                    }
                });
                
                // Enter key
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        searchBtn.click();
                    }
                });
            }
            
            //
