const calendar = document.getElementById("calendar");
const popup = document.getElementById("popup");
const selectedDateText = document.getElementById("selectedDate");
const subjectContainer = document.getElementById("subjectContainer");

let selectedDate = null;
let studyData = JSON.parse(localStorage.getItem("studyData")) || {};

// Cấu hình API AI (Bạn hãy thay API Key của mình vào đây)
const GEMINI_API_KEY = "AIzaSyC4BWtU9rD4Yv2cw_Sus1VhAXJ30GLw1Ho";

function generateCalendar() {
    calendar.innerHTML = "";
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement("div");
        day.className = "day";
        day.innerText = i;
        if (studyData[i]) day.classList.add("hasStudy");
        day.onclick = () => openPopup(i);
        calendar.appendChild(day);
    }
}

function openPopup(date) {
    selectedDate = date;
    popup.classList.remove("hidden");
    selectedDateText.innerText = "Ngày " + date;
    renderSubjects();
}

function closePopup() {
    popup.classList.add("hidden");
    generateCalendar();
    updateChart();
    updateKnowledgeGraph();
    analyzeWithAI(); // Tự động phân tích khi có dữ liệu mới
}

function renderSubjects() {
    subjectContainer.innerHTML = "";
    const subjects = studyData[selectedDate] || [];
    subjects.forEach((sub, index) => {
        const input = document.createElement("input");
        input.value = sub;
        input.style.marginBottom = "10px";
        input.onchange = (e) => {
            studyData[selectedDate][index] = e.target.value;
            saveData();
        };
        subjectContainer.appendChild(input);
    });
}

function addSubject() {
    if (!studyData[selectedDate]) studyData[selectedDate] = [];
    if (studyData[selectedDate].length >= 2) return alert("Mỗi ngày tối đa 2 môn!");
    studyData[selectedDate].push("Môn mới");
    saveData();
    renderSubjects();
}

function saveData() { localStorage.setItem("studyData", JSON.stringify(studyData)); }

// --- TÍNH NĂNG AI THỰC TẾ ---

async function askDeepAI() {
    const inputField = document.getElementById("aiSearchInput");
    const display = document.getElementById("aiBox");
    const query = inputField.value.trim();
    if (!query) return;

    display.innerHTML = "<i>AI Twin đang truy cập dữ liệu toàn cầu...</i>";
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Bạn là trợ lý học tập cá nhân. Hãy giải thích ngắn gọn và khoa học: ${query}` }]}]
            })
        });
        const data = await response.json();
        display.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        display.innerText = "Lỗi: Không thể kết nối bộ não AI. Kiểm tra API Key.";
    }
}

function analyzeWithAI() {
    const totalDays = Object.keys(studyData).length;
    const aiBox = document.getElementById("aiBox");
    
    // Thuật toán dự báo điểm số đơn giản dựa trên dữ liệu
    let prediction = totalDays * 0.5 + 4; 
    prediction = prediction > 10 ? 10 : prediction;

    aiBox.innerHTML = `<b>PHÂN TÍCH HÀNH VI:</b><br>Bạn đã học ${totalDays} ngày. Dự báo điểm số kỳ vọng của Digital Twin: <b>${prediction.toFixed(1)}/10</b>. Cần tối ưu thêm sự nhất quán.`;
}

// --- BIỂU ĐỒ & GRAPH ---

function updateChart() {
    const ctx = document.getElementById("studyChart").getContext("2d");
    const total = Object.keys(studyData).length;

    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4 (Dự báo)"],
            datasets: [{
                label: "Mức độ tập trung dự kiến",
                data: [total, total + 1, total + 3, total + 5],
                borderColor: "#ffffff",
                borderWidth: 1,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            scales: {
                y: { display: false },
                x: { ticks: { color: "white" }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateKnowledgeGraph() {
    const kg = document.getElementById("knowledgeGraph");
    kg.innerHTML = "";
    let subjects = new Set();
    Object.values(studyData).forEach(arr => arr.forEach(sub => subjects.add(sub)));
    subjects.forEach(sub => {
        const node = document.createElement("div");
        node.className = "node";
        node.innerText = sub;
        kg.appendChild(node);
    });
}

// Khởi chạy hệ thống
generateCalendar();
updateChart();
updateKnowledgeGraph();
