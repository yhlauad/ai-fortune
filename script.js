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

    // Gender Selection Logic
    const genderBtns = document.querySelectorAll('.gender-btn');
    const genderInput = document.getElementById('gender');

    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            genderInput.value = btn.dataset.value;
        });
    });

    // Date & Time Picker Modal Elements
    const datePickerModal = document.getElementById('date-picker-modal');
    const timePickerModal = document.getElementById('time-picker-modal');
    const openDatePicker = document.getElementById('open-date-picker');
    const openTimePicker = document.getElementById('open-time-picker');
    const confirmDateBtn = document.getElementById('confirm-date');
    const confirmTimeBtn = document.getElementById('confirm-time');
    const dateDisplay = document.getElementById('date-display');
    const timeDisplay = document.getElementById('time-display');
    const syncWheelsToInputs = (modalId) => {
        const modal = document.getElementById(modalId);
        const pickers = modal.querySelectorAll('.wheel-picker');
        pickers.forEach(picker => {
            const inputId = `birth-${picker.dataset.type}`;
            const targetInput = document.getElementById(inputId);
            const value = targetInput.value;
            const items = picker.querySelectorAll('.wheel-item');
            const index = Array.from(items).findIndex(item => item.dataset.value == value);
            if (index !== -1) {
                setTimeout(() => {
                    picker.scrollTo({
                        top: index * 30,
                        behavior: 'auto'
                    });
                    // Force update active status after scroll
                    if (picker.updateActive) picker.updateActive();
                }, 100);
            }



        });
    };

    openDatePicker.addEventListener('click', () => {
        datePickerModal.classList.add('active');
        syncWheelsToInputs('date-picker-modal');
    });

    openTimePicker.addEventListener('click', () => {
        timePickerModal.classList.add('active');
        syncWheelsToInputs('time-picker-modal');
    });

    confirmDateBtn.addEventListener('click', () => {
        datePickerModal.classList.remove('active');
        updateSummaryDisplay();
    });

    confirmTimeBtn.addEventListener('click', () => {
        timePickerModal.classList.remove('active');
        updateSummaryDisplay();
    });

    const updateSummaryDisplay = () => {
        const year = document.getElementById('birth-year').value;
        const month = document.getElementById('birth-month').value;
        const day = document.getElementById('birth-day').value;
        const hour = document.getElementById('birth-hour').value;
        const minute = document.getElementById('birth-minute').value;

        if (dateDisplay) dateDisplay.textContent = `${year}年${month}月${day}日`;
        if (timeDisplay) timeDisplay.textContent = `${hour}時${minute}分`;
    };

    // Wheel Picker Logic
    const initWheelPicker = (id, options, defaultValue) => {
        const picker = document.getElementById(id);
        const scroll = picker.querySelector('.wheel-scroll');
        const hiddenInput = document.getElementById(picker.getAttribute('id').replace('-wheel', 'birth-').replace('birth-', picker.dataset.type === 'year' || picker.dataset.type === 'month' || picker.dataset.type === 'day' ? 'birth-' : 'birth-'));
        // Note: The ID mapping in HTML was slightly inconsistent, let's just target directly or fix it.
        // Actually I used birth-year, birth-month, birth-day, birth-hour, birth-minute.
        const inputId = `birth-${picker.dataset.type}`;
        const targetInput = document.getElementById(inputId);

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'wheel-item';
            item.dataset.value = opt.value;
            item.textContent = opt.label;
            scroll.appendChild(item);
        });

        const items = picker.querySelectorAll('.wheel-item');

        const updateActive = () => {
            const rect = picker.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;

            let closestItem = null;
            let minDistance = Infinity;

            items.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenterY = itemRect.top + itemRect.height / 2;
                const distance = Math.abs(centerY - itemCenterY);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestItem = item;
                }
            });

            if (closestItem) {
                items.forEach(i => i.classList.remove('active'));
                closestItem.classList.add('active');
                targetInput.value = closestItem.dataset.value;
            }
        };

        // Expose updateActive for external calls (like syncWheelsToInputs)
        picker.updateActive = updateActive;

        picker.addEventListener('scroll', () => {

            clearTimeout(picker.scrollTimeout);
            picker.scrollTimeout = setTimeout(updateActive, 50);
        });

        // --- Desktop Support: Mouse Drag and Wheel ---
        let isDown = false;
        let startY;
        let scrollTop;

        picker.addEventListener('mousedown', (e) => {
            isDown = true;
            picker.classList.add('dragging');
            startY = e.pageY - picker.offsetTop;
            scrollTop = picker.scrollTop;
            picker.style.scrollSnapType = 'none'; // Disable snapping while dragging
        });

        window.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            picker.classList.remove('dragging');
            picker.style.scrollSnapType = 'y mandatory'; // Re-enable snapping

            // Trigger snap-to-item
            const index = Math.round(picker.scrollTop / 30);
            picker.scrollTo({
                top: index * 30,
                behavior: 'smooth'
            });
            setTimeout(updateActive, 150);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const y = e.pageY - picker.offsetTop;
            const walk = (y - startY) * 1.5; // Scroll speed
            picker.scrollTop = scrollTop - walk;
        });

        // Explicit wheel support if needed (though native scroll works, this ensures focus)
        picker.addEventListener('wheel', (e) => {
            e.preventDefault();
            picker.scrollTop += e.deltaY;
            clearTimeout(picker.scrollTimeout);
            picker.scrollTimeout = setTimeout(() => {
                const index = Math.round(picker.scrollTop / 30);
                picker.scrollTo({
                    top: index * 30,
                    behavior: 'smooth'
                });
                updateActive();
            }, 150);
        }, { passive: false });

        // Set default
        const defaultIndex = options.findIndex(o => o.value == defaultValue);
        if (defaultIndex !== -1) {
            picker.scrollTop = defaultIndex * 30;
            setTimeout(updateActive, 100);
        }
    };


    // Years (1900 to 2050)
    const years = [];
    for (let i = 1900; i <= 2050; i++) years.push({ value: i, label: i + '年' });
    initWheelPicker('year-wheel', years, 1990);

    // Months
    const months = [];
    for (let i = 1; i <= 12; i++) months.push({ value: i, label: i + '月' });
    initWheelPicker('month-wheel', months, 1);

    // Days
    const days = [];
    for (let i = 1; i <= 31; i++) days.push({ value: i, label: i + '日' });
    initWheelPicker('day-wheel', days, 1);

    // Hours
    const hours = [];
    for (let i = 0; i <= 23; i++) hours.push({ value: i < 10 ? '0' + i : i, label: (i < 10 ? '0' + i : i) + '時' });
    initWheelPicker('hour-wheel', hours, '00');

    // Minutes
    const minutes = [];
    for (let i = 0; i <= 59; i++) minutes.push({ value: i < 10 ? '0' + i : i, label: (i < 10 ? '0' + i : i) + '分' });
    initWheelPicker('minute-wheel', minutes, '00');

    updateSummaryDisplay();

    // Webhook URL
    const WEBHOOK_URL = 'https://n8n-1306.zeabur.app/webhook/sinaihk-fortune';

    let selectedMBTI = 'ENFP'; // Default from UI
    let currentThreadsText = ''; // Store specialized sharing text

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
        const masterMsg = currentThreadsText || document.getElementById('master-message')?.innerText || '';
        const promoText = `\n🏮 大仙特別批算：\n唔好盲摸摸！【AI 黃大仙】結合MBTI同八字，幫你搵埋2026 邊個係你嘅最強 Back-up (貴人)。\n⛩️ 立即指點迷津：https://sinaihk-ai-fortune.zeabur.app/`;
        return masterMsg + promoText;
    };

    copyLinkBtn?.addEventListener('click', () => {
        const fullText = getShareText();
        navigator.clipboard.writeText(fullText).then(() => {
            alert('大仙寄語已複製到剪貼簿！');
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
            gender: genderInput.value,
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

        // Store specialized threads sharing text if available
        if (data["threads-text"]) {
            currentThreadsText = data["threads-text"];
        } else {
            currentThreadsText = ''; // Reset if not provided
        }
    }


    // Back Button
    document.querySelector('.back-to-input')?.addEventListener('click', () => {
        reportSection.classList.remove('active');
        inputSection.classList.add('active');
    });
});
