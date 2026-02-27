// Khởi tạo Biểu đồ Dự báo (Roadmap Chart)
function initChart() {
    const ctx = document.getElementById('roadmapChart').getContext('2d');
    
    // Gradient cho đường thực tế
    let gradientReal = ctx.createLinearGradient(0, 0, 0, 400);
    gradientReal.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
    gradientReal.addColorStop(1, 'rgba(0, 243, 255, 0.0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4 (Hiện tại)', 'Tuần 5 (Dự báo)', 'Tuần 6 (Dự báo)'],
            datasets: [
                {
                    label: 'Điểm số thực tế',
                    data: [6.5, 7.0, 7.2, 7.8, null, null],
                    borderColor: '#00f3ff',
                    backgroundColor: gradientReal,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00f3ff'
                },
                {
                    label: 'Điểm số dự báo (Dựa trên thói quen hiện tại)',
                    data: [null, null, null, 7.8, 8.5, 9.2],
                    borderColor: '#bc13fe',
                    borderDash: [5, 5], // Đường nét đứt thể hiện sự dự báo
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: '#bc13fe'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e2e8f0' } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 10 }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

// Hàm mô phỏng AI Deep Search
function simulateSearch() {
    const inputField = document.getElementById('searchInput');
    const input = inputField.value.trim();
    const chatBox = document.getElementById('chatBox');
    
    if(!input) return;

    // Hiển thị câu hỏi của user
    chatBox.innerHTML += `<p style="color: var(--neon-blue);"><b>Bạn:</b> ${input}</p>`;
    chatBox.innerHTML += `<p id="loadingMsg"><b>System:</b> <i>Đang quét WolframAlpha & Chegg...</i></p>`;
    
    // Tự động cuộn xuống cuối cùng
    chatBox.scrollTop = chatBox.scrollHeight;
    inputField.value = '';

    // Mô phỏng độ trễ (delay) khi AI đang "suy nghĩ"
    setTimeout(() => {
        document.getElementById('loadingMsg').remove();
        chatBox.innerHTML += `<p><b>AI Tutor:</b> Dựa trên dữ liệu toàn cầu, cách giải tối ưu nhất cho "${input}" là sử dụng phương pháp chia nhỏ vấn đề (First Principles). Đây là các bước chi tiết...</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1500);
}

// Lắng nghe sự kiện Enter trong ô tìm kiếm
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        simulateSearch();
    }
});

// Sự kiện tương tác với Twin Avatar (Mô phỏng Bio-Sync)
document.getElementById('twinAvatar').addEventListener('click', function() {
    const statusText = document.getElementById('twinStatus');
    
    // Chuyển sang trạng thái cảnh báo (Cam)
    this.style.background = 'radial-gradient(circle, var(--neon-orange) 0%, transparent 70%)';
    this.style.boxShadow = '0 0 50px var(--neon-orange)';
    statusText.innerText = 'Phát hiện căng thẳng. Đề xuất bài tập thở 2 phút!';
    statusText.style.color = 'var(--neon-orange)';
    
    // Tự động hồi phục sau 4 giây (Trở về Xanh)
    setTimeout(() => {
        this.style.background = 'radial-gradient(circle, var(--neon-blue) 0%, transparent 70%)';
        this.style.boxShadow = '0 0 50px var(--neon-blue)';
        statusText.innerText = 'Hệ thống đồng bộ: Ổn định. Sẵn sàng học tập!';
        statusText.style.color = 'var(--neon-blue)';
    }, 4000);
});

// Chạy khởi tạo biểu đồ khi trang web load xong
window.onload = () => {
    initChart();
};
