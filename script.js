let roadmapChart;

// Dữ liệu mô phỏng cho từng môn học
const subjectData = {
    math: {
        label: "Toán Học",
        badge: "Toán Giải Tích",
        realPoints: [6.5, 7.0, 7.2, 7.8, null, null],
        predPoints: [null, null, null, 7.8, 8.5, 9.2],
        tipTitle: "💡 Kỹ thuật: Spaced Repetition",
        tipDesc: "Bạn thường quên công thức Logarit sau 3 ngày. Hãy ôn lại ngay!"
    },
    physics: {
        label: "Vật Lý",
        badge: "Điện Xoay Chiều",
        realPoints: [5.0, 5.5, 6.5, 6.8, null, null],
        predPoints: [null, null, null, 6.8, 7.5, 8.0],
        tipTitle: "💡 Kỹ thuật: Feynman",
        tipDesc: "Hãy thử giải thích định luật Ohm cho 'Twin' của bạn bằng ngôn ngữ đơn giản."
    },
    english: {
        label: "Tiếng Anh",
        badge: "IELTS Reading",
        realPoints: [7.5, 7.5, 8.0, 8.5, null, null],
        predPoints: [null, null, null, 8.5, 8.8, 9.0],
        tipTitle: "💡 Kỹ thuật: Skimming",
        tipDesc: "Kỹ năng đọc lướt của bạn đang cải thiện. Tập trung vào từ khóa (Keywords)."
    }
};

// Khởi tạo biểu đồ
function initChart(subjectKey) {
    const ctx = document.getElementById('roadmapChart').getContext('2d');
    const data = subjectData[subjectKey];

    if (roadmapChart) roadmapChart.destroy(); // Hủy biểu đồ cũ nếu có

    roadmapChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4 (Nay)', 'Tuần 5 (Dự báo)', 'Tuần 6 (Dự báo)'],
            datasets: [
                {
                    label: 'Điểm thực thực tế',
                    data: data.realPoints,
                    borderColor: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Dự báo xu hướng',
                    data: data.predPoints,
                    borderColor: '#bc13fe',
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f1f5f9', font: { family: 'Inter' } } }
            },
            scales: {
                y: { min: 0, max: 10, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#64748b' }, grid: { display: false } }
            }
        }
    });
}

// Hàm cập nhật toàn bộ Dashboard khi chọn môn học
function updateSubject() {
    const key = document.getElementById('subjectSelect').value;
    const data = subjectData[key];

    // Cập nhật text
    document.getElementById('wisdomBadge').innerText = `Môn: ${data.label}`;
    document.getElementById('chartLabel').innerText = `Dữ liệu: ${data.label}`;
    document.getElementById('tipTitle').innerText = data.tipTitle;
    document.getElementById('tipDesc').innerText = data.tipDesc;
    document.getElementById('tutorSub').innerText = `(${data.label})`;
    
    // Cập nhật biểu đồ
    initChart(key);

    // Hiệu ứng thông báo từ AI
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = `<p><b>AI Tutor:</b> Đã chuyển dữ liệu sang môn <b>${data.label}</b>. Tôi đang tải các bài tập phù hợp...</p>`;
}

// Giữ lại các hàm cũ nhưng tối ưu hơn
function simulateSearch() {
    const input = document.getElementById('searchInput').value;
    const chatBox = document.getElementById('chatBox');
    if(!input) return;

    chatBox.innerHTML += `<p style="color: var(--neon-blue);"><b>Bạn:</b> ${input}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        chatBox.innerHTML += `<p><b>AI Tutor:</b> Đang phân tích "${input}" trong cơ sở dữ liệu... Đã tìm thấy 3 phương pháp giải nhanh!</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

// Init lần đầu
window.onload = () => {
    initChart('math');
};
