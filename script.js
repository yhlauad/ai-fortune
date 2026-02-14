document.addEventListener('DOMContentLoaded', () => {
    const fortuneForm = document.getElementById('fortune-form');
    const inputSection = document.getElementById('input-section');
    const reportSection = document.getElementById('report-section');
    const generateBtn = document.getElementById('generate-btn');
    const loader = document.getElementById('loader');
    const mbtiBtns = document.querySelectorAll('.mbti-btn');
    const loadingModal = document.getElementById('loading-modal');

    // Webhook URL
    const WEBHOOK_URL = 'https://n8n-1306.zeabur.app/webhook/sinaihk-fortune';

    let selectedMBTI = 'ENFP'; // Default from UI
    let radarChartInstance = null;

    // MBTI Selection
    mbtiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mbtiBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMBTI = btn.getAttribute('data-value');
        });
    });

    fortuneForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const year = document.getElementById('birth-year').value;
        const month = document.getElementById('birth-month').value;
        const day = document.getElementById('birth-day').value;
        const hour = document.getElementById('birth-hour').value || '00';
        const minute = document.getElementById('birth-minute').value || '00';
        const question = document.getElementById('question').value;

        // Format: YYYY-MM-DD-HH-MM
        const birthStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}-${hour.padStart(2, '0')}-${minute.padStart(2, '0')}`;

        // Show loading state and Modal
        generateBtn.disabled = true;
        loader.style.display = 'inline-block';
        generateBtn.querySelector('span').textContent = '報告生成中...';
        loadingModal.classList.add('active');

        // Modal Step Animation simulation
        const dots = loadingModal.querySelectorAll('.step-dot');
        let currentDot = 0;
        const dotInterval = setInterval(() => {
            dots.forEach(d => d.classList.remove('active'));
            currentDot = (currentDot + 1) % dots.length;
            dots[currentDot].classList.add('active');
        }, 3000);

        const payload = [{
            birth: birthStr,
            mbti: selectedMBTI.toLowerCase(),
            question: question
        }];

        try {
            console.log('Sending payload:', payload);
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const result = await response.json();
            const data = Array.isArray(result) ? result[0] : result;

            console.log('Received data:', data);

            // Hide modal before transition
            loadingModal.classList.remove('active');
            clearInterval(dotInterval);

            // Populate Report data
            populateReport(data);

            // Switch view
            inputSection.classList.remove('active');
            reportSection.classList.add('active');
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('Error:', error);
            loadingModal.classList.remove('active');
            clearInterval(dotInterval);
            alert('系統繁忙，或伺服器無回應。請稍後再試。');
        } finally {
            generateBtn.disabled = false;
            loader.style.display = 'none';
            generateBtn.querySelector('span').textContent = '開始 AI 算命';
        }
    });

    function populateReport(data) {
        // Radar Chart Fallback - try to extract from analysis content if not provided as fields
        const radarSource = data["bazi-analysis-content"] || "";
        const extractPercent = (key) => {
            const match = radarSource.match(new RegExp(`${key}：(\\d+)%`));
            return match ? parseInt(match[1]) : (data[key] ? parseInt(data[key]) : 20);
        };
        const fiveElements = {
            wood: extractPercent("木"),
            fire: extractPercent("火"),
            water: extractPercent("水"),
            earth: extractPercent("土"),
            metal: extractPercent("金")
        };
        initRadarChart(fiveElements);

        // Bazi Chart (Demo values)
        const baziBoxes = {
            'year-stem': '乙', 'year-branch': '亥',
            'month-stem': '己', 'month-branch': '卯',
            'day-stem': '壬', 'day-branch': '辰',
            'hour-stem': '丁', 'hour-branch': '未'
        };
        Object.entries(baziBoxes).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        // Simple Markdown formatter
        const formatText = (text) => {
            if (!text) return '';
            return text
                .replace(/### (.*)/g, '<h4 class="sub-header">$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        };

        const renderAnalysis = (elementId, content) => {
            const container = document.getElementById(elementId);
            if (!container) return;
            container.innerHTML = `<div class="content-wrapper">${formatText(content)}</div>`;
        };

        // NEW MAPPING based on User's specified response structure
        if (data["bazi-analysis-content"]) renderAnalysis('bazi-analysis-content', data["bazi-analysis-content"]);
        if (data["career-analysis-content"]) renderAnalysis('career-analysis-content', data["career-analysis-content"]);
        if (data["love-analysis-content"]) renderAnalysis('love-analysis-content', data["love-analysis-content"]);
        if (data["wealth-analysis-content"]) renderAnalysis('wealth-analysis-content', data["wealth-analysis-content"]);
        if (data["luck-guide-content"]) renderAnalysis('luck-guide-content', data["luck-guide-content"]);
        if (data["event-text"]) renderAnalysis('event-text', data["event-text"]);
        if (data["turning-text"]) renderAnalysis('turning-point-text', data["turning-text"]);
        if (data["answer-text"]) renderAnalysis('answer-text', data["answer-text"]);

        const masterEl = document.getElementById('master-message');
        if (masterEl && data["master-text"]) {
            masterEl.innerHTML = formatText(data["master-text"]);
        }
    }

    function initRadarChart(fiveElements) {
        const ctx = document.getElementById('radarChart')?.getContext('2d');
        if (!ctx) return;

        if (radarChartInstance) {
            radarChartInstance.destroy();
        }

        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['木', '火', '土', '金', '水'],
                datasets: [{
                    label: '五行分佈',
                    data: [
                        fiveElements.wood,
                        fiveElements.fire,
                        fiveElements.earth,
                        fiveElements.metal,
                        fiveElements.water
                    ],
                    backgroundColor: 'rgba(240, 201, 77, 0.4)',
                    borderColor: '#f0c94d',
                    borderWidth: 3,
                    pointBackgroundColor: '#f0c94d',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#f0c94d',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(240, 201, 77, 0.2)' },
                        grid: { color: 'rgba(240, 201, 77, 0.2)' },
                        pointLabels: {
                            color: '#f0c94d',
                            font: { size: 16, weight: '700' }
                        },
                        ticks: { display: false, stepSize: 20 },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Back Button
    document.querySelector('.back-to-input')?.addEventListener('click', () => {
        reportSection.classList.remove('active');
        inputSection.classList.add('active');
    });
});
