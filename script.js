
// تهيئة المتغيرات
let currentStage = 1;
let correctAnswer = 0;
let isAnswered = false;
let wrongCount = 0; // عداد الأخطاء في المرحلة الحالية
let totalStages = 100;
let answerRevealed = false; // هل تم إظهار الإجابة بالفعل
let points = 0; // نقاط اللاعب

// عناصر DOM
const stageNumberSpan = document.getElementById('stageNumber');
const difficultyIcon = document.getElementById('difficultyIcon');
const difficultyText = document.getElementById('difficultyText');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const currentStageSpan = document.getElementById('currentStage');
const resetBtn = document.getElementById('resetBtn');
const winMessage = document.getElementById('winMessage');
const pointsDisplay = document.getElementById('pointsDisplay');

// إنشاء أصوات باستخدام Web Audio API
let audioContext;
let correctSound, wrongSound, pointsUpSound, pointsDownSound;

// تهيئة الصوت (يتم استدعاؤها عند أول تفاعل)
function initAudio() {
    if (audioContext) return; // تم التهيئة مسبقاً
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // صوت صحيح (نغمة مرتفعة)
    correctSound = (time) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start(time);
        osc.stop(time + 0.3);
    };
    
    // صوت خطأ (نغمة منخفضة)
    wrongSound = (time) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 200;
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start(time);
        osc.stop(time + 0.2);
    };
    
    // صوت زيادة النقاط (نغمة تصاعدية)
    pointsUpSound = (time) => {
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.value = 600;
        
        osc2.type = 'sine';
        osc2.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.2);
        osc2.stop(time + 0.2);
    };
    
    // صوت نقصان النقاط (نغمة تنازلية)
    pointsDownSound = (time) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = 300;
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.start(time);
        osc.stop(time + 0.2);
    };
}

// تشغيل صوت صحيح
function playCorrectSound() {
    try {
        initAudio();
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                correctSound(audioContext.currentTime);
            });
        } else {
            correctSound(audioContext.currentTime);
        }
    } catch (e) {
        console.log('تعذر تشغيل الصوت:', e);
    }
}

// تشغيل صوت خطأ
function playWrongSound() {
    try {
        initAudio();
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                wrongSound(audioContext.currentTime);
            });
        } else {
            wrongSound(audioContext.currentTime);
        }
    } catch (e) {
        console.log('تعذر تشغيل الصوت:', e);
    }
}

// تشغيل صوت زيادة النقاط
function playPointsUpSound() {
    try {
        initAudio();
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                pointsUpSound(audioContext.currentTime);
            });
        } else {
            pointsUpSound(audioContext.currentTime);
        }
    } catch (e) {
        console.log('تعذر تشغيل الصوت:', e);
    }
}

// تشغيل صوت نقصان النقاط
function playPointsDownSound() {
    try {
        initAudio();
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                pointsDownSound(audioContext.currentTime);
            });
        } else {
            pointsDownSound(audioContext.currentTime);
        }
    } catch (e) {
        console.log('تعذر تشغيل الصوت:', e);
    }
}

// تحديث عرض النقاط مع تأثير بصري
function updatePointsDisplay(change) {
    pointsDisplay.textContent = points;
    
    // إضافة تأثير بصري حسب نوع التغيير
    if (change > 0) {
        pointsDisplay.classList.add('increase');
        setTimeout(() => pointsDisplay.classList.remove('increase'), 500);
        
        // عرض رسالة مؤقتة للزيادة
        showPointsChangeMessage(`+${change} نقطة`, 'positive');
    } else if (change < 0) {
        pointsDisplay.classList.add('decrease');
        setTimeout(() => pointsDisplay.classList.remove('decrease'), 500);
        
        // عرض رسالة مؤقتة للنقصان
        showPointsChangeMessage(`${change} نقطة`, 'negative');
    }
}

// عرض رسالة تغيير النقاط
function showPointsChangeMessage(message, type) {
    const existingMsg = document.querySelector('.points-change');
    if (existingMsg) existingMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `points-change ${type}`;
    msgDiv.textContent = message;
    
    optionsContainer.parentNode.insertBefore(msgDiv, optionsContainer.nextSibling);
    
    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 1000);
}

// تحديث مستوى الصعوبة
function updateDifficulty() {
    if (currentStage <= 20) {
        difficultyIcon.textContent = '🌱';
        difficultyText.textContent = 'سهل';
    } else if (currentStage <= 40) {
        difficultyIcon.textContent = '🌿';
        difficultyText.textContent = 'متوسط';
    } else if (currentStage <= 60) {
        difficultyIcon.textContent = '🔥';
        difficultyText.textContent = 'صعب';
    } else if (currentStage <= 80) {
        difficultyIcon.textContent = '💪';
        difficultyText.textContent = 'شديد';
    } else {
        difficultyIcon.textContent = '👑';
        difficultyText.textContent = 'أسطوري';
    }
}

// إنشاء سؤال عشوائي حسب المرحلة
function generateQuestion() {
    let num1, num2, operation, question, answer;
    
    // زيادة الصعوبة مع تقدم المراحل
    if (currentStage <= 20) {
        // مراحل سهلة: جمع وطرح أرقام صغيرة
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        operation = Math.random() < 0.7 ? '+' : '-';
    } else if (currentStage <= 40) {
        // مراحل متوسطة: ضرب وقسمة بسيطة
        if (Math.random() < 0.5) {
            num1 = Math.floor(Math.random() * 12) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
            operation = '×';
        } else {
            num1 = Math.floor(Math.random() * 50) + 20;
            num2 = Math.floor(Math.random() * 30) + 10;
            operation = '+';
        }
    } else if (currentStage <= 60) {
        // مراحل صعبة: عمليات مركبة
        if (Math.random() < 0.4) {
            num1 = Math.floor(Math.random() * 20) + 5;
            num2 = Math.floor(Math.random() * 10) + 2;
            operation = '×';
        } else {
            num1 = Math.floor(Math.random() * 100) + 50;
            num2 = Math.floor(Math.random() * 50) + 25;
            operation = '+';
        }
    } else if (currentStage <= 80) {
        // مراحل شديدة: أرقام كبيرة وعمليات معقدة
        if (Math.random() < 0.3) {
            num1 = Math.floor(Math.random() * 30) + 10;
            num2 = Math.floor(Math.random() * 15) + 5;
            operation = '×';
        } else {
            num1 = Math.floor(Math.random() * 200) + 100;
            num2 = Math.floor(Math.random() * 100) + 50;
            operation = '+';
        }
    } else {
        // مراحل أسطورية: أرقام ضخمة
        if (Math.random() < 0.5) {
            num1 = Math.floor(Math.random() * 50) + 25;
            num2 = Math.floor(Math.random() * 30) + 10;
            operation = '×';
        } else {
            num1 = Math.floor(Math.random() * 500) + 200;
            num2 = Math.floor(Math.random() * 300) + 100;
            operation = '+';
        }
    }

    // حساب النتيجة الصحيحة
    switch(operation) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            // التأكد من أن النتيجة موجبة
            if (num1 < num2) {
                [num1, num2] = [num2, num1];
            }
            answer = num1 - num2;
            break;
        case '×':
            answer = num1 * num2;
            break;
        default:
            answer = num1 + num2;
    }

    question = `${num1} ${operation} ${num2}`;
    return { question, answer };
}

// إنشاء خيارات عشوائية
function generateOptions(correctAnswer) {
    let options = [correctAnswer];
    
    // تحديد مدى الاختلاف حسب الصعوبة
    let range;
    if (currentStage <= 20) range = 5;
    else if (currentStage <= 40) range = 15;
    else if (currentStage <= 60) range = 30;
    else if (currentStage <= 80) range = 50;
    else range = 100;

    while (options.length < 4) {
        let wrongAnswer;
        if (Math.random() < 0.5) {
            wrongAnswer = correctAnswer + Math.floor(Math.random() * range) + 1;
        } else {
            wrongAnswer = Math.max(1, correctAnswer - Math.floor(Math.random() * range) - 1);
        }
        
        // التأكد من عدم تكرار الخيارات
        if (!options.includes(wrongAnswer) && wrongAnswer > 0) {
            options.push(wrongAnswer);
        }
    }

    // خلط الخيارات
    return options.sort(() => Math.random() - 0.5);
}

// إظهار الإجابة الصحيحة
function showCorrectAnswer() {
    if (answerRevealed) return; // تم إظهار الإجابة مسبقاً
    
    answerRevealed = true;
    const allButtons = document.querySelectorAll('.option-btn');
    
    allButtons.forEach(btn => {
        if (parseInt(btn.textContent) === correctAnswer) {
            btn.classList.add('show-answer');
            btn.style.animation = 'pulse 0.5s ease';
        }
        btn.disabled = true; // تعطيل جميع الأزرار
    });
    
    // إنشاء رسالة إضافية
    const existingCounter = document.querySelector('.wrong-counter');
    if (!existingCounter) {
        const counterDiv = document.createElement('div');
        counterDiv.className = 'wrong-counter';
        counterDiv.textContent = '⚠️ لقد أخطأت مرتين. هذه هي الإجابة الصحيحة. انتقل للمرحلة التالية';
        optionsContainer.parentNode.insertBefore(counterDiv, optionsContainer.nextSibling);
    }
    
    // بعد 3 ثواني ننتقل للمرحلة التالية تلقائياً
    setTimeout(() => {
        // إزالة رسالة العداد
        const counterMsg = document.querySelector('.wrong-counter');
        if (counterMsg) counterMsg.remove();
        
        // الانتقال للمرحلة التالية
        if (currentStage < totalStages) {
            currentStage++;
            loadStage();
        } else if (currentStage === totalStages) {
            currentStage++;
            showWinMessage();
        }
    }, 3000);
}

// تحميل المرحلة الحالية
function loadStage() {
    if (currentStage > totalStages) {
        showWinMessage();
        return;
    }

    isAnswered = false;
    wrongCount = 0;
    answerRevealed = false;
    
    const { question, answer } = generateQuestion();
    correctAnswer = answer;
    questionText.textContent = question;
    
    const options = generateOptions(answer);
    
    // عرض الخيارات
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => checkAnswer(option, button);
        optionsContainer.appendChild(button);
    });

    // تحديث الأرقام المعروضة
    stageNumberSpan.textContent = currentStage;
    currentStageSpan.textContent = currentStage;
    updateDifficulty();
    
    // إزالة أي رسالة سابقة
    const existingCounter = document.querySelector('.wrong-counter');
    if (existingCounter) existingCounter.remove();
    
    const pointsMsg = document.querySelector('.points-change');
    if (pointsMsg) pointsMsg.remove();
}

// التحقق من الإجابة
function checkAnswer(selectedAnswer, button) {
    if (isAnswered || answerRevealed) return;
    isAnswered = true;

    const allButtons = document.querySelectorAll('.option-btn');
    
    if (selectedAnswer === correctAnswer) {
        // إجابة صحيحة
        playCorrectSound();
        playPointsUpSound();
        
        // زيادة النقاط
        points += 10;
        updatePointsDisplay(10);
        
        // تلوين الزر
        button.classList.add('correct');
        
        // إزالة رسالة العداد إذا موجودة
        const existingCounter = document.querySelector('.wrong-counter');
        if (existingCounter) existingCounter.remove();
        
        if (currentStage < totalStages) {
            setTimeout(() => {
                currentStage++;
                loadStage();
            }, 500);
        } else if (currentStage === totalStages) {
            setTimeout(() => {
                currentStage++;
                showWinMessage();
            }, 500);
        }
    } else {
        // إجابة خاطئة
        playWrongSound();
        playPointsDownSound();
        
        // نقصان النقاط
        points -= 10;
        updatePointsDisplay(-10);
        
        // تلوين الزر
        button.classList.add('wrong');
        wrongCount++;
        
        // إنشاء أو تحديث رسالة العداد
        let counterDiv = document.querySelector('.wrong-counter');
        if (!counterDiv) {
            counterDiv = document.createElement('div');
            counterDiv.className = 'wrong-counter';
            optionsContainer.parentNode.insertBefore(counterDiv, optionsContainer.nextSibling);
        }
        
        if (wrongCount >= 2) {
            // بعد الخطأ الثاني نظهر الإجابة الصحيحة
            counterDiv.textContent = '⚠️ هذا خطأك الثاني. سيتم إظهار الإجابة الصحيحة...';
            
            setTimeout(() => {
                // إظهار الإجابة الصحيحة
                showCorrectAnswer();
            }, 500);
        } else {
            // الخطأ الأول فقط
            counterDiv.textContent = `❌ إجابة خاطئة. لديك محاولة واحدة متبقية (خطأ ${wrongCount}/2)`;
            
            setTimeout(() => {
                // إعادة تعيين الألوان والسماح بمحاولة أخرى
                allButtons.forEach(btn => {
                    btn.classList.remove('wrong');
                });
                isAnswered = false;
            }, 1000);
        }
    }
}

// إظهار رسالة الفوز
function showWinMessage() {
    questionText.textContent = '🏆 أنت عبقري! 🏆';
    optionsContainer.innerHTML = '';
    winMessage.style.display = 'block';
    
    // إزالة أي رسائل
    const existingCounter = document.querySelector('.wrong-counter');
    if (existingCounter) existingCounter.remove();
    
    const pointsMsg = document.querySelector('.points-change');
    if (pointsMsg) pointsMsg.remove();
}

// إعادة تعيين اللعبة
function resetGame() {
    currentStage = 1;
    wrongCount = 0;
    answerRevealed = false;
    points = 0; // إعادة تعيين النقاط
    winMessage.style.display = 'none';
    
    // تحديث عرض النقاط
    pointsDisplay.textContent = points;
    
    // إزالة أي رسائل
    const existingCounter = document.querySelector('.wrong-counter');
    if (existingCounter) existingCounter.remove();
    
    const pointsMsg = document.querySelector('.points-change');
    if (pointsMsg) pointsMsg.remove();
    
    loadStage();
}

// إضافة مستمع لزر إعادة البدء
resetBtn.addEventListener('click', resetGame);

// تهيئة الصوت عند أول نقرة في الصفحة
document.addEventListener('click', function initAudioOnFirstClick() {
    initAudio();
    document.removeEventListener('click', initAudioOnFirstClick);
}, { once: true });

// بدء اللعبة
loadStage();