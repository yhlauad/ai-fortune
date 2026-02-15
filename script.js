document.addEventListener('DOMContentLoaded', () => {
    const fortuneForm = document.getElementById('fortune-form');
    const inputSection = document.getElementById('input-section');
    const reportSection = document.getElementById('report-section');
    const generateBtn = document.getElementById('generate-btn');
    const loader = document.getElementById('loader');
    const mbtiBtns = document.querySelectorAll('.mbti-btn');
    const loadingModal = document.getElementById('loading-modal');
    const mbtiUnknown = document.getElementById('mbti-unknown');
    const mbtiGrid = document.getElementById('mbti-grid');
    const shareModal = document.getElementById('share-modal');
    const shareBtn = document.querySelector('.share-btn');
    const closeShareBtn = document.querySelector('.close-modal-btn');
    const shareThreadsBtn = document.getElementById('share-threads');
    const copyLinkBtn = document.getElementById('copy-link');

    // Webhook URL
    const WEBHOOK_URL = 'https://n8n-1306.zeabur.app/webhook/sinaihk-fortune';

    let selectedMBTI = 'ENFP'; // Default from UI

    // MBTI Selection
    mbtiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (mbtiUnknown.checked) return;
            mbtiBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMBTI = btn.getAttribute('data-value');
        });
    });

    mbtiUnknown.addEventListener('change', () => {
        if (mbtiUnknown.checked) {
            mbtiGrid.style.opacity = '0.4';
            mbtiGrid.style.pointerEvents = 'none';
        } else {
            mbtiGrid.style.opacity = '1';
            mbtiGrid.style.pointerEvents = 'auto';
        }
    });

    // Share Functionality
    shareBtn?.addEventListener('click', () => shareModal.classList.add('active'));
    closeShareBtn?.addEventListener('click', () => shareModal.classList.remove('active'));

    const getShareText = () => {
        const masterMsg = document.getElementById('master-message')?.innerText || '';
        const promoText = `\n\n準到發毛！【AI 黃大仙】唔單止識講大師寄語，連我 2026 年嘅八字大運都睇穿晒。🔮\n想知自己係咪今年轉運？入嚟搵大師傾下：\n👉 [你的 App 下載/連結]`;
        return masterMsg + promoText;
    };

    copyLinkBtn?.addEventListener('click', () => {
        const fullText = getShareText();
        navigator.clipboard.writeText(fullText).then(() => {
            alert('大師寄語及推廣文字已複製到剪貼簿！');
            shareModal.classList.remove('active');
        });
    });

    shareThreadsBtn?.addEventListener('click', () => {
        const fullText = getShareText();
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(fullText)}`;
        window.open(url, '_blank');
        shareModal.classList.remove('active');
    });

    // Navigation highlighting
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.card[id]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').slice(1) === current) {
                item.classList.add('active');
            }
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
        const unknownTime = document.getElementById('unknown-time').checked;
        const mbtiUnknownVal = mbtiUnknown.checked;

        // Format: YYYY-MM-DD-HH-MM (HH-MM is XX-XX if unknown)
        let birthStr;
        if (unknownTime) {
            birthStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}-XX-XX`;
        } else {
            birthStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}-${hour.padStart(2, '0')}-${minute.padStart(2, '0')}`;
        }

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
            mbti: mbtiUnknownVal ? "unknown" : selectedMBTI.toLowerCase(),
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
        // 五行分佈比例圖 removed from UI as per request

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


    // Back Button
    document.querySelector('.back-to-input')?.addEventListener('click', () => {
        reportSection.classList.remove('active');
        inputSection.classList.add('active');
    });
});
