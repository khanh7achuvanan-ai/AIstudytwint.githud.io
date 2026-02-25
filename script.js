const calendar = document.getElementById("calendar");
const popup = document.getElementById("popup");
const selectedDateText = document.getElementById("selectedDate");
const subjectContainer = document.getElementById("subjectContainer");

let selectedDate = null;
let studyData = JSON.parse(localStorage.getItem("studyData")) || {};

function generateCalendar() {
    calendar.innerHTML = "";
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement("div");
        day.className = "day";
        day.innerText = i;

        if (studyData[i]) {
            day.classList.add("hasStudy");
        }

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
    runAI();
    updateKnowledgeGraph();
}

function renderSubjects() {
    subjectContainer.innerHTML = "";
    const subjects = studyData[selectedDate] || [];
    subjects.forEach((sub, index) => {
        const input = document.createElement("input");
        input.value = sub;
        input.onchange = (e) => {
            studyData[selectedDate][index] = e.target.value;
            saveData();
        };
        subjectContainer.appendChild(input);
    });
}

function addSubject() {
    if (!studyData[selectedDate]) {
        studyData[selectedDate] = [];
    }
    if (studyData[selectedDate].length >= 2) {
        alert("Mỗi ngày chỉ tối đa 2 môn!");
        return;
    }
    studyData[selectedDate].push("Môn mới");
    saveData();
    renderSubjects();
}

function saveData() {
    localStorage.setItem("studyData", JSON.stringify(studyData));
}

function updateChart() {
    const ctx = document.getElementById("studyChart").getContext("2d");
    const total = Object.keys(studyData).length;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Ngày có học"],
            datasets: [{
                label: "Số ngày",
                data: [total]
            }]
        }
    });
}

function runAI() {
    const total = Object.keys(studyData).length;
    let message = "";

    if (total < 5) {
        message = "⚠ Bạn học hơi ít. Cần tăng tần suất.";
    } else if (total < 15) {
        message = "👍 Bạn đang duy trì ổn định.";
    } else {
        message = "🔥 Phong độ cực cao!";
    }

    document.getElementById("aiBox").innerText = message;
}

function updateKnowledgeGraph() {
    const kg = document.getElementById("knowledgeGraph");
    kg.innerHTML = "";

    let subjects = new Set();
    Object.values(studyData).forEach(arr => {
        arr.forEach(sub => subjects.add(sub));
    });

    subjects.forEach(sub => {
        const node = document.createElement("div");
        node.className = "node";
        node.innerText = sub;
        kg.appendChild(node);
    });
}

generateCalendar();
updateChart();
runAI();
updateKnowledgeGraph();

