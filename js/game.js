"use strict";

// ========================================
// SETTINGS
// ========================================
const TOTAL_SECTIONS = 6;
const VALID_TEAMS = ["A", "B", "C", "D", "E", "F"];
const COUNTDOWN_TIME = 1000;
const NEXT_QUESTION_DELAY = 200;

// ========================================
// TEAM
// ========================================
function resolveTeam() {
    const params = new URLSearchParams(location.search);
    const raw = (params.get("team") || "A").trim().toUpperCase();
    return VALID_TEAMS.includes(raw) ? raw : "A";
}
const TEAM = resolveTeam();

// ========================================
// GAME STATE
// ========================================
let sectionsData = {};
let currentSection = 1;
let sectionQuestions = [];
let currentQuestionIndex = 0;

let currentAnswer = "";
let currentPosition = 0;

let score = 0;
let miss = 0;
let combo = 0;

let totalScore = 0;
let totalMiss = 0;

let sectionStartTime = 0;
let sectionTimes = [];

let sectionTotalChars = 0;
let sectionCharsTyped = 0;

let timerInterval = null;

let gameStarted = false;
let sectionFinished = false;
let processingAnswer = false;

// ========================================
// DOM
// ========================================
const sectionNumber = document.getElementById("section-number");
const questionNumber = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const typingInput = document.getElementById("typing-input");
const timerDisplay = document.getElementById("timer");
const teamName = document.getElementById("team-name");
const runner = document.getElementById("runner");

const progressCurrent = document.getElementById("progress-current");
const progressTotal = document.getElementById("progress-total");
const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");

const romajiProgress = document.getElementById("romaji-progress");

const countdownOverlay = document.getElementById("countdown-overlay");
const countdown = document.getElementById("countdown");

const resultOverlay = document.getElementById("result-overlay");
const resultTime = document.getElementById("result-time");
const resultScore = document.getElementById("result-score");
const resultMiss = document.getElementById("result-miss");

const errorOverlay = document.getElementById("error-overlay");
const errorMessage = document.getElementById("error-message");
const errorReloadButton = document.getElementById("error-reload-button");

const finalOverlay = document.getElementById("final-overlay");
const finalTime = document.getElementById("final-time");
const finalScore = document.getElementById("final-score");
const finalMiss = document.getElementById("final-miss");

const restartButton = document.getElementById("restart-button");

const scoreDisplay = document.getElementById("score");
const missDisplay = document.getElementById("miss");
const comboDisplay = document.getElementById("combo");
const accuracyDisplay = document.getElementById("accuracy");
const gameStateDisplay = document.getElementById("game-state");

const teamItems = document.querySelectorAll(".team-item");

// ========================================
// TEAM APPLY
// ========================================
function applyTeam() {
    teamName.textContent = TEAM;
    runner.src = `img/character/${TEAM}team.png`;
    runner.alt = `Team ${TEAM}`;
}

// ========================================
// CSV LOADING (section1〜section6)
// ========================================
async function loadAllSections() {
    questionText.textContent = "問題データを読み込んでいます……";

    for (let section = 1; section <= TOTAL_SECTIONS; section++) {
        const path = `data/section${section}.csv`;
        const response = await fetch(path, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`${path} の読み込みに失敗しました。`);
        }

        const csvText = await response.text();
        const rows = parseCSV(csvText, path);

        sectionsData[section] = rows;
    }
}

// CSVパース（あなたのCSV形式に対応）
function parseCSV(csvText, path) {
    csvText = csvText.replace(/^\uFEFF/, "");
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");

    const headers = parseCSVLine(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (!cols) continue;

        result.push({
            question_no: cols[0],
            section: cols[1],
            title: cols[2],
            display: cols[3],
            answer: normalizeAnswer(cols[4])
        });
    }
    return result;
}

function parseCSVLine(line) {
    const pattern = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
    const cols = line.match(pattern);
    if (!cols) return null;
    return cols.map(c => c.replace(/^"(.*)"$/, "$1"));
}

function normalizeAnswer(str) {
    return str
        .replaceAll("[半角スペース]", " ")
        .replaceAll("[全角スペース]", "　");
}

// ========================================
// SECTION PREPARE
// ========================================
function prepareSection() {
    stopTimer();

    gameStarted = false;
    sectionFinished = false;
    processingAnswer = false;

    typingInput.disabled = true;
    typingInput.value = "";

    score = 0;
    miss = 0;
    combo = 0;

    sectionQuestions = sectionsData[currentSection];
    currentQuestionIndex = 0;

    sectionTotalChars = sectionQuestions.reduce(
        (sum, q) => sum + q.answer.length,
        0
    );
    sectionCharsTyped = 0;

    sectionNumber.textContent = currentSection;

    updateScore();
    resetRunner();
    showQuestion();

    showSectionReady();
}

// ========================================
// READY画面（ENTERで開始）
// ========================================
function showSectionReady() {
    resultOverlay.classList.remove("active");
    finalOverlay.classList.remove("active");

    questionText.textContent = `SECTION ${currentSection}\nPRESS ENTER TO START`;
    romajiProgress.textContent = "";
}

// ========================================
// ENTERでカウントダウン開始
// ========================================
document.addEventListener("keydown", (e) => {
    if (!resultOverlay.classList.contains("active") &&
        !finalOverlay.classList.contains("active") &&
        !gameStarted &&
        e.key === "Enter") {
        startCountdown();
    }

    // SECTION FINISH → ENTERで次へ
    if (resultOverlay.classList.contains("active") && e.key === "Enter") {
        currentSection++;
        if (currentSection > TOTAL_SECTIONS) {
            finishRace();
        } else {
            prepareSection();
        }
    }

    // FINAL → ENTERで再スタート
    if (finalOverlay.classList.contains("active") && e.key === "Enter") {
        restartGame();
    }
});

// ========================================
// COUNTDOWN
// ========================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startCountdown() {
    countdownOverlay.classList.add("active");
    const seq = ["3", "2", "1", "GO!"];

    for (const s of seq) {
        countdown.textContent = s;
        countdown.classList.remove("countdown-pop");
        void countdown.offsetWidth;
        countdown.classList.add("countdown-pop");
        await sleep(COUNTDOWN_TIME);
    }

    countdownOverlay.classList.remove("active");
    startGame();
}

// ========================================
// GAME START
// ========================================
function startGame() {
    gameStarted = true;
    sectionStartTime = performance.now();
    startTimer();

    typingInput.disabled = true;
    typingInput.value = "";

    showQuestion();
}

// ========================================
// TIMER
// ========================================
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        if (!gameStarted) return;
        const elapsed = performance.now() - sectionStartTime;
        timerDisplay.textContent = formatTime(elapsed);
    }, 10);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milli = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milli).padStart(3, "0")}`;
}

// ========================================
// SHOW QUESTION
// ========================================
function showQuestion() {
    if (currentQuestionIndex >= sectionQuestions.length) {
        finishSection();
        return;
    }

    const q = sectionQuestions[currentQuestionIndex];
    currentAnswer = q.answer;
    currentPosition = 0;

    questionNumber.textContent = `QUESTION ${currentQuestionIndex + 1}`;
    questionText.textContent = q.display;

    renderRomajiProgress();
    updateProgress();
}

// ========================================
// ROMAJI PROGRESS
// ========================================
function renderRomajiProgress() {
    const typed = currentAnswer.slice(0, currentPosition);
    const rest = currentAnswer.slice(currentPosition);
    romajiProgress.innerHTML =
        `<span class="romaji-typed">${typed}</span><span class="romaji-rest">${rest}</span>`;
}

// ========================================
// KEYDOWN 判定（1文字判定）
// ========================================
document.addEventListener("keydown", (event) => {
    if (!gameStarted || sectionFinished || processingAnswer) return;
    if (event.key.length !== 1) return;

    event.preventDefault();

    const key = event.key;
    const target = currentAnswer[currentPosition];
    if (!target) return;

    if (key === target) {
        currentPosition++;
        score++;
        combo++;
        sectionCharsTyped++;

        updateScore();
        renderRomajiProgress();
        moveRunner();

        if (currentPosition >= currentAnswer.length) {
            processingAnswer = true;
            setTimeout(() => {
                currentQuestionIndex++;
                processingAnswer = false;
                showQuestion();
            }, NEXT_QUESTION_DELAY);
        }
    } else {
        miss++;
        combo = 0;
        updateScore();
    }
});

// ========================================
// SCORE DISPLAY
// ========================================
function updateScore() {
    scoreDisplay.textContent = score;
    missDisplay.textContent = miss;
    comboDisplay.textContent = combo;

    const attempts = score + miss;
    const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 100;
    accuracyDisplay.textContent = `${accuracy}%`;
}

// ========================================
// PROGRESS（問題数ベース）
// ========================================
function updateProgress() {
    const current = currentQuestionIndex;
    const total = sectionQuestions.length;

    progressCurrent.textContent = current;
    progressTotal.textContent = total;

    const percent = total > 0 ? (current / total) * 100 : 0;
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
}

// ========================================
// RUNNER（総文字数ベース）
// ========================================
function resetRunner() {
    runner.style.left = "0%";
    runner.classList.remove("runner-finish");
}

function moveRunner() {
    const percent = (sectionCharsTyped / sectionTotalChars) * 100;
    const safePercent = Math.min(percent, 94);
    runner.style.left = `${safePercent}%`;

    if (sectionCharsTyped >= sectionTotalChars) {
        runner.classList.add("runner-finish");
    }
}

// ========================================
// FINISH SECTION
// ========================================
function finishSection() {
    sectionFinished = true;
    gameStarted = false;

    stopTimer();
    typingInput.disabled = true;

    const elapsed = performance.now() - sectionStartTime;
    sectionTimes[currentSection - 1] = elapsed;

    totalScore += score;
    totalMiss += miss;

    resultTime.textContent = formatTime(elapsed);
    resultScore.textContent = score;
    resultMiss.textContent = miss;

    resultOverlay.classList.add("active");
}

// ========================================
// FINISH RACE
// ========================================
function finishRace() {
    stopTimer();
    gameStarted = false;

    const totalElapsed = sectionTimes.reduce((sum, t) => sum + t, 0);

    finalTime.textContent = formatTime(totalElapsed);
    finalScore.textContent = totalScore;
    finalMiss.textContent = totalMiss;

    finalOverlay.classList.add("active");
}

// ========================================
// RESTART
// ========================================
restartButton.addEventListener("click", restartGame);

function restartGame() {
    stopTimer();

    currentSection = 1;
    currentQuestionIndex = 0;

    score = 0;
    miss = 0;
    combo = 0;

    totalScore = 0;
    totalMiss = 0;

    sectionTimes = [];

    sectionStartTime = 0;

    sectionTotalChars = 0;
    sectionCharsTyped = 0;

    gameStarted = false;
    sectionFinished = false;
    processingAnswer = false;

    resultOverlay.classList.remove("active");
    finalOverlay.classList.remove("active");
    errorOverlay.classList.remove("active");

    timerDisplay.textContent = "00:00.000";

    updateScore();
    prepareSection();
}

// ========================================
// ERROR
// ========================================
function showError(message) {
    stopTimer();
    gameStarted = false;
    typingInput.disabled = true;

    errorMessage.textContent = message;
    errorOverlay.classList.add("active");
}

errorReloadButton.addEventListener("click", () => location.reload());

// ========================================
// INIT
// ========================================
async function initializeGame() {
    try {
        applyTeam();
        updateScore();
        timerDisplay.textContent = "00:00.000";

        await loadAllSections();
        prepareSection();

    } catch (error) {
        console.error(error);
        showError("ゲーム初期化に失敗しました。\n" + error.message);
    }
}

document.addEventListener("DOMContentLoaded", initializeGame);
