// ===== DATA MODULE =====
const StudyData = (function() {
    // Private data store
    let data = {
        subjects: {},
        sessions: [],
        streak: 0,
        lastActive: null,
        twinState: 'idle',
        xp: 0,
        level: 1,
        energy: 100
    };

    // Khởi tạo dữ liệu mẫu cho 11 môn
    const initSubjectData = () => {
        const subjects = {
            math: {
                name: 'Toán',
                icon: '📐',
                real: [6.5, 7.0, 7.2, 7.8],
                consistency: 0.75,
                accuracy: 0.78,
                timeSpent: 120,
                recentTrend: [7.2, 7.5, 7.8],
                weaknesses: ['Hình học không gian', 'Tích phân', 'Số phức'],
                studyFrequency: 4
            },
            english: {
                name: 'Tiếng Anh',
                icon: '📘',
                real: [7.0, 7.3, 7.8, 8.1],
                consistency: 0.85,
                accuracy: 0.82,
                timeSpent: 150,
                recentTrend: [7.5, 7.8, 8.1],
                weaknesses: ['Từ vựng', 'Phrasal verbs', 'IELTS Writing'],
                studyFrequency: 5
            },
            physics: {
                name: 'Vật Lý',
                icon: '⚡',
                real: [6.0, 6.8, 7.5, 7.9],
                consistency: 0.7,
                accuracy: 0.72,
                timeSpent: 100,
                recentTrend: [7.0, 7.5, 7.9],
                weaknesses: ['Điện từ', 'Lượng tử ánh sáng', 'Dao động'],
                studyFrequency: 3
            },
            chemistry: {
                name: 'Hóa Học',
                icon: '🧪',
                real: [7.2, 7.5, 7.9, 8.3],
                consistency: 0.8,
                accuracy: 0.79,
                timeSpent: 110,
                recentTrend: [7.5, 7.9, 8.3],
                weaknesses: ['Hóa hữu cơ', 'Phản ứng oxi hóa khử'],
                studyFrequency: 4
            },
            biology: {
                name: 'Sinh Học',
                icon: '🧬',
                real: [7.5, 7.8, 8.0, 8.2],
                consistency: 0.78,
                accuracy: 0.8,
                timeSpent: 130,
                recentTrend: [7.8, 8.0, 8.2],
                weaknesses: ['Cấu trúc tế bào', 'Di truyền học'],
                studyFrequency: 3
            },
            literature: {
                name: 'Ngữ Văn',
                icon: '📖',
                real: [7.0, 7.3, 7.6, 7.8],
                consistency: 0.72,
                accuracy: 0.7,
                timeSpent: 140,
                recentTrend: [7.3, 7.6, 7.8],
                weaknesses: ['Nghị luận xã hội', 'Phân tích thơ'],
                studyFrequency: 4
            },
            history: {
                name: 'Lịch Sử',
                icon: '🏛️',
                real: [7.8, 8.0, 8.2, 8.5],
                consistency: 0.88,
                accuracy: 0.85,
                timeSpent: 90,
                recentTrend: [8.0, 8.2, 8.5],
                weaknesses: ['Mốc thời gian', 'Sự kiện thế giới'],
                studyFrequency: 3
            },
            geography: {
                name: 'Địa Lý',
                icon: '🌍',
                real: [7.4, 7.7, 8.0, 8.3],
                consistency: 0.82,
                accuracy: 0.8,
                timeSpent: 85,
                recentTrend: [7.7, 8.0, 8.3],
                weaknesses: ['Bản đồ', 'Kinh tế vùng'],
                studyFrequency: 3
            },
            civics: {
                name: 'GDCD',
                icon: '🤝',
                real: [8.0, 8.2, 8.4, 8.6],
                consistency: 0.9,
                accuracy: 0.88,
                timeSpent: 70,
                recentTrend: [8.2, 8.4, 8.6],
                weaknesses: ['Pháp luật', 'Đạo đức kinh doanh'],
                studyFrequency: 2
            },
            informatics: {
                name: 'Tin Học',
                icon: '💻',
                real: [7.9, 8.1, 8.3, 8.5],
                consistency: 0.86,
                accuracy: 0.84,
                timeSpent: 95,
                recentTrend: [8.1, 8.3, 8.5],
                weaknesses: ['Thuật toán', 'Cấu trúc dữ liệu'],
                studyFrequency: 3
            },
            technology: {
                name: 'Công Nghệ',
                icon: '🔧',
                real: [7.3, 7.6, 7.9, 8.2],
                consistency: 0.74,
                accuracy: 0.75,
                timeSpent: 80,
                recentTrend: [7.6, 7.9, 8.2],
                weaknesses: ['Bản vẽ kỹ thuật', 'Vật liệu cơ khí'],
                studyFrequency: 2
            }
        };
        
        // Thêm predicted scores
        Object.keys(subjects).forEach(key => {
            const subject = subjects[key];
            subject.predicted = generatePrediction(subject);
        });
        
        data.subjects = subjects;
    };

    // Prediction Engine
    const generatePrediction = (subjectData) => {
        const lastScore = subjectData.real[subjectData.real.length - 1];
        const trend = subjectData.recentTrend;
        
        // Tính momentum
        let momentum = 0;
        for (let i = 1; i < trend.length; i++) {
            momentum += (trend[i] - trend[i - 1]);
        }
        momentum = momentum / (trend.length - 1);
        
        // Tính confidence dựa trên consistency và accuracy
        const confidence = (subjectData.consistency * 0.4 + subjectData.accuracy * 0.6) * 100;
        
        // Dự báo 3 bước tiếp theo
        const predicted = [];
        let current = lastScore;
        
        for (let i = 0; i < 3; i++) {
            // Momentum giảm dần
            const stepMomentum = momentum * Math.pow(0.7, i);
            // Thêm random nhẹ để tự nhiên
            const random = (Math.random() - 0.5) * 0.2;
            current = Math.min(10, Math.max(0, current + stepMomentum + random));
            predicted.push(Number(current.toFixed(1)));
        }
        
        return {
            values: predicted,
            confidence: Math.round
