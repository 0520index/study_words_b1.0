// --------------------
// 要素取得
// --------------------
const cardContainer = document.getElementById('card-container');
const frontCard = document.querySelector('.front');
const backCard = document.querySelector('.back');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const resetButton = document.getElementById('reset-button');
const shuffleButton = document.getElementById('shuffle-button');
const wrongButton = document.getElementById('wrong-button');
const correctButton = document.getElementById('correct-button');
const reviewButtonHome = document.getElementById('review-wrong'); // ホームの復習ボタン
const addButton = document.getElementById('add-button');
const loadFile = document.getElementById('load-file');
const addQuestionInput = document.getElementById('new-question');
const addAnswerInput = document.getElementById('new-answer');

// ホーム画面切替
const homeScreen = document.getElementById('home-screen');
const learningScreen = document.getElementById('learning-screen');
const addCardScreen = document.getElementById('add-card-screen');
const loadJsonScreen = document.getElementById('load-json-screen');

let cardsData = JSON.parse(localStorage.getItem("cardsData") || "[]");
let originalCards = [...cardsData];
let currentCardIndex = 0;
let isFlipped = false;
let reviewMode = false;
let wrongCards = JSON.parse(localStorage.getItem("wrongCards") || "[]");

// --------------------
// 学習画面専用: 復習画面に移動ボタン
// --------------------
const reviewButtonLearning = document.createElement('button');
reviewButtonLearning.textContent = "📚 復習画面に移動";
reviewButtonLearning.id = "review-button-learning";
reviewButtonLearning.style.marginLeft = "8px";
reviewButtonLearning.style.padding = "6px 10px";
reviewButtonLearning.style.fontSize = "14px";
reviewButtonLearning.style.borderRadius = "6px";
reviewButtonLearning.style.backgroundColor = "#9C27B0";
reviewButtonLearning.style.color = "white";
reviewButtonLearning.style.cursor = "pointer";

// 上部操作エリアに追加
document.querySelector('.misc-controls-top').appendChild(reviewButtonLearning);

// クリックで復習モードに移行
reviewButtonLearning.addEventListener('click', () => {
    if (!reviewMode) reviewWrong();
});

// 初期状態では全カードに戻る非表示
resetButton.style.display = "none";
reviewButtonLearning.style.display = "none";

// --------------------
// 画面切替関数
// --------------------
function showScreen(screen) {
    [homeScreen, learningScreen, addCardScreen, loadJsonScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// --------------------
// カード表示
// --------------------
function showCard() {
    if (cardsData.length === 0) {
        frontCard.textContent = "カードがありません";
        backCard.textContent = "";
        return;
    }
    frontCard.textContent = cardsData[currentCardIndex].question;
    backCard.textContent = cardsData[currentCardIndex].answer;
    isFlipped = false;
    cardContainer.classList.remove('flipped');
    updateProgress();
    updateAccuracy();
}

// --------------------
// 進捗・正答率
// --------------------
function updateProgress() {
    document.getElementById("progress").textContent = `${currentCardIndex + 1} / ${cardsData.length}`;
}
function updateAccuracy() {
    const total = originalCards.length;
    const correct = total - wrongCards.length;
    const rate = total ? Math.round((correct / total) * 100) : 100;
    document.getElementById("accuracy").textContent = `正解率: ${rate}%`;
}

// --------------------
// フリップ
// --------------------
function flipCard() {
    isFlipped = !isFlipped;
    cardContainer.classList.toggle('flipped');
}
cardContainer.addEventListener('click', flipCard);

// --------------------
// カード移動
// --------------------
function fadeAndChange(callback) {
    cardContainer.classList.add('fade');
    setTimeout(() => { callback(); cardContainer.classList.remove('fade'); }, 200);
}
function nextCard() { fadeAndChange(() => { currentCardIndex = (currentCardIndex + 1) % cardsData.length; showCard(); }); }
function prevCard() { fadeAndChange(() => { currentCardIndex = (currentCardIndex - 1 + cardsData.length) % cardsData.length; showCard(); }); }
function shuffleCards() {
    for (let i = cardsData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsData[i], cardsData[j]] = [cardsData[j], cardsData[i]];
    }
    currentCardIndex = 0;
    showCard();
}

// --------------------
// 間違え・正解
// --------------------
function markWrong() {
    const card = cardsData[currentCardIndex];
    const date = new Date().toISOString().split('T')[0];
    const existing = wrongCards.find(c => c.question === card.question && c.answer === card.answer);
    if (existing) { existing.wrongCount++; existing.lastWrong = date; }
    else { wrongCards.push({ ...card, wrongCount: 1, lastWrong: date }); }
    localStorage.setItem("wrongCards", JSON.stringify(wrongCards));
    updateAccuracy();
    alert("間違えた問題を記録しました！");
    nextCard();
}

function markCorrect() {
    const card = cardsData[currentCardIndex];

    if (reviewMode) {
        // wrongCards から削除
        const idxWrong = wrongCards.findIndex(c => c.question === card.question && c.answer === card.answer);
        if (idxWrong !== -1) {
            wrongCards.splice(idxWrong, 1);
            localStorage.setItem("wrongCards", JSON.stringify(wrongCards));
        }

        // cardsData（復習中の配列）からも削除
        cardsData.splice(currentCardIndex, 1);

        // originalCards からも削除してローカルストレージに保存
        const idxOriginal = originalCards.findIndex(c => c.question === card.question && c.answer === card.answer);
        if (idxOriginal !== -1) {
            originalCards.splice(idxOriginal, 1);
            localStorage.setItem("cardsData", JSON.stringify(originalCards));
        }

        if (cardsData.length === 0) {
            alert("復習が終了しました！");
            resetCards();
            return;
        }

        showCard();
    } else {
        nextCard();
    }
}

// --------------------
// 復習モード
// --------------------
function reviewWrong() {
    if (!reviewMode) {
        learningScreen.classList.add('review-mode');
        if (wrongCards.length === 0) { alert("まだ間違えた問題がありません"); return; }
        originalCards = [...cardsData];
        cardsData = [...wrongCards].sort((a, b) => b.wrongCount - a.wrongCount);
        currentCardIndex = 0;
        reviewMode = true;
        resetButton.style.display = "inline-block";
        reviewButtonLearning.style.display = "none";
        showScreen(learningScreen);
        showCard();
        alert("間違えた問題だけを復習します");
    } else {
        learningScreen.classList.remove('review-mode');
        cardsData = [...originalCards];
        currentCardIndex = 0;
        reviewMode = false;
        resetButton.style.display = "none";
        reviewButtonLearning.style.display = "inline-block";
        showCard();
        alert("全ての問題に戻りました");
    }
}

// --------------------
// 全カードに戻る
// --------------------
function resetCards() {
    if (reviewMode) {
        learningScreen.classList.remove('review-mode');
        cardsData = [...originalCards];
        currentCardIndex = 0;
        reviewMode = false;
        resetButton.style.display = "none";
        reviewButtonLearning.style.display = "inline-block";
        showCard();
    }
}

// --------------------
// カード追加
// --------------------
addButton.addEventListener('click', () => {
    const q = addQuestionInput.value.trim();
    const a = addAnswerInput.value.trim();
    if (!q || !a) { alert("問題と答えを入力してください"); return; }
    const newCard = { question: q, answer: a };
    cardsData.push(newCard);
    originalCards.push(newCard);
    localStorage.setItem("cardsData", JSON.stringify(originalCards));
    addQuestionInput.value = "";
    addAnswerInput.value = "";
    alert("カードを追加しました");
});

// --------------------
// JSON読み込み
// --------------------
loadFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const loaded = JSON.parse(ev.target.result);
            if (Array.isArray(loaded) && loaded.every(c => c.question && c.answer)) {
                cardsData = [...loaded];
                originalCards = [...cardsData];
                currentCardIndex = 0;
                localStorage.setItem("cardsData", JSON.stringify(originalCards));
                alert("問題を読み込みました");
            } else { alert("ファイル形式が正しくありません"); }
        } catch (err) { alert("読み込み中にエラー"); console.error(err); }
    }
    reader.readAsText(file);
});

// --------------------
// ボタンイベント
// --------------------
prevButton.addEventListener('click', prevCard);
nextButton.addEventListener('click', nextCard);
shuffleButton.addEventListener('click', shuffleCards);
wrongButton.addEventListener('click', markWrong);
correctButton.addEventListener('click', markCorrect);
resetButton.addEventListener('click', resetCards);

document.getElementById('start-learning').addEventListener('click', () => {
    showScreen(learningScreen);
    reviewButtonLearning.style.display = "inline-block";
    showCard();
});
document.getElementById('add-card-home').addEventListener('click', () => { showScreen(addCardScreen); });
document.getElementById('load-json-home').addEventListener('click', () => { showScreen(loadJsonScreen); });
document.getElementById('review-wrong').addEventListener('click', reviewWrong);
document.getElementById('home-btn-learning').addEventListener('click', () => {
    showScreen(homeScreen);
    reviewMode = false;
    resetButton.style.display = "none";
    reviewButtonLearning.style.display = "none";
});
document.getElementById('home-btn-add').addEventListener('click', () => {
    showScreen(homeScreen);
    reviewMode = false;
    resetButton.style.display = "none";
});
document.getElementById('home-btn-json').addEventListener('click', () => {
    showScreen(homeScreen);
    reviewMode = false;
    resetButton.style.display = "none";
});
