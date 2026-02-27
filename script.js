let chart;

const dataSubjects = {
    english: {
        tip: "Bạn nên ôn từ vựng theo phương pháp Spaced Repetition.",
        real: [7, 7.5, 8],
        predicted: [8.2, 8.5]
    },
    math: {
        tip: "Cần luyện thêm tích phân và hình học không gian.",
        real: [6.5, 7, 7.8],
        predicted: [8.0, 8.3]
    },
    physics: {
        tip: "Ôn lại chuyên đề điện từ.",
        real: [6, 6.8, 7.5],
        predicted: [7.7, 8.0]
    }
};

function initChart(subject) {
    const ctx = document.getElementById("roadmapChart");

    if (chart) chart.destroy();

    const d = dataSubjects[subject];

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Dự báo 1", "Dự báo 2"],
            datasets: [
                {
                    label: "Thực tế",
                    data: [...d.real, null, null],
                    borderColor: "#2a9dff"
                },
                {
                    label: "Dự báo",
                    data: [null, null, d.real[2], d.predicted[0], d.predicted[1]],
                    borderColor: "#9d4edd",
                    borderDash: [5,5]
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 5,
                    max: 10
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {

    const selector = document.getElementById("subjectSelector");
    const tipBox = document.getElementById("dailyTip");
    const askBtn = document.getElementById("askBtn");
    const questionInput = document.getElementById("questionInput");
    const chatBox = document.getElementById("chatBox");

    initChart("english");
    tipBox.textContent = dataSubjects["english"].tip;

    selector.addEventListener("change", function() {
        const subject = selector.value;
        tipBox.textContent = dataSubjects[subject].tip;
        initChart(subject);
    });

    askBtn.addEventListener("click", function() {
        const q = questionInput.value.trim();
        if (!q) return;

        chatBox.innerHTML += `<div><b>Bạn:</b> ${q}</div>`;
        chatBox.innerHTML += `<div><b>AI:</b> Hãy tập trung vào điểm yếu của môn này nhé!</div>`;
        questionInput.value = "";
    });

});
