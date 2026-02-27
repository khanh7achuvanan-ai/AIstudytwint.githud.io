let chart;
const subjectSelector = document.getElementById("subjectSelector");
const dailyTip = document.getElementById("dailyTip");
const chatBox = document.getElementById("chatBox");
const twinAvatar = document.getElementById("twinAvatar");
const twinStatus = document.getElementById("twinStatus");

const subjectData = {
    math: {
        tip: "🔢 Ôn lại chuyên đề Vector. Twin dự báo có nguy cơ giảm 0.8 điểm nếu không luyện tập.",
        real: [6.5, 7.0, 7.2, 7.8],
        predict: [7.8, 8.4, 9.0]
    },
    english: {
        tip: "📘 Bạn hay quên từ vựng sau 3 ngày. Hệ thống kích hoạt Spaced Repetition.",
        real: [7.0, 7.3, 7.8, 8.1],
        predict: [8.1, 8.7, 9.1]
    },
    physics: {
        tip: "⚡ Sai số trong bài động lượng đang tăng. Cần luyện thêm bài tập nâng cao.",
        real: [6.0, 6.8, 7.5, 7.9],
        predict: [7.9, 8.2, 8.8]
    }
};

function initChart(subject = "math") {
    const ctx = document.getElementById("roadmapChart");

    if (chart) chart.destroy();

    const data = subjectData[subject];

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["T1", "T2", "T3", "T4", "T5*", "T6*"],
            datasets: [
                {
                    label: "Thực tế",
                    data: [...data.real, null, null],
                    borderColor: "#00f3ff",
                    tension: 0.4
                },
                {
                    label: "Dự báo",
                    data: [null, null, null, data.real[3], ...data.predict.slice(1)],
                    borderColor: "#bc13fe",
                    borderDash: [5,5],
                    tension: 0.4
                }
            ]
        },
        options: {
            scales: {
                y: { min: 0, max: 10 }
            }
        }
    });

    dailyTip.innerText = data.tip;
}

subjectSelector.addEventListener("change", (e) => {
    initChart(e.target.value);
});

document.getElementById("searchBtn").addEventListener("click", () => {
    const input = document.getElementById("searchInput");
    if (!input.value) return;

    chatBox.innerHTML += `<p><b>Bạn:</b> ${input.value}</p>`;
    chatBox.innerHTML += `<p><b>AI:</b> Phân tích lỗi sai và đề xuất phương pháp First Principles...</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    input.value = "";
});

twinAvatar.addEventListener("click", () => {
    twinAvatar.style.background = "radial-gradient(circle, #ffaa00, transparent)";
    twinAvatar.style.boxShadow = "0 0 40px #ffaa00";
    twinStatus.innerText = "⚠ Phát hiện stress - đề xuất nghỉ 2 phút";

    setTimeout(() => {
        twinAvatar.style.background = "radial-gradient(circle, #00f3ff, transparent)";
        twinAvatar.style.boxShadow = "0 0 40px #00f3ff";
        twinStatus.innerText = "Hệ thống đồng bộ ổn định";
    }, 3000);
});

initChart();
