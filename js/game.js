// ========================================
// KIR RECREATION TOURNAMENT 2026
// めちゃむずキーボード早打ち駅伝
// ========================================

"use strict";


// ========================================
// GAME SETTINGS
// ========================================

const TOTAL_SECTIONS = 5;
const VALID_TEAMS = ["A", "B", "C", "D", "E", "F"];
const COUNTDOWN_TIME = 1000;
const NEXT_QUESTION_DELAY = 200;


// ========================================
// TEAM (URLパラメータで決定・固定)
// ========================================

function resolveTeam() {

    const params =
        new URLSearchParams(location.search);

    const raw =
        (params.get("team") || "A")
            .trim()
            .toUpperCase();

    return VALID_TEAMS.includes(raw) ? raw : "A";
}

const TEAM = resolveTeam();


// ========================================
// GAME STATE
// ========================================

// セクションごとの問題データ { 1: [...], 2: [...], ... }
let sectionsData = {};

let currentSection = 1;
let sectionQuestions = [];
let currentQuestionIndex = 0;

let currentAnswer = "";
let currentPosition = 0;

// 現在のセクションの成績（セクションごとにリセット）
let score = 0;
let miss = 0;
let combo = 0;

// レース全体の累計成績
let totalScore = 0;
let totalMiss = 0;

// セクションのプレイ時間（結果表示中の待ち時間は含まない）
let sectionStartTime = 0;
let sectionTimes = [];

// ランナー用：セクション内の総文字数と入力済み文字数
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
const nextSectionButton = document.getElementById("next-section-button");

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

const teamItems =
    document.querySelectorAll(".team-item");


// ========================================
// INITIAL CHECK
// ========================================

function checkDOM() {

    const requiredElements = [
        ["section-number", sectionNumber],
        ["question-number", questionNumber],
        ["question-text", questionText],
        ["typing-input", typingInput],
        ["timer", timerDisplay],
        ["team-name", teamName],
        ["runner", runner],
        ["progress-current", progressCurrent],
        ["progress-total", progressTotal],
        ["progress-fill", progressFill],
        ["countdown-overlay", countdownOverlay],
        ["countdown", countdown],
        ["result-overlay", resultOverlay],
        ["next-section-button", nextSectionButton],
        ["error-overlay", errorOverlay],
        ["error-message", errorMessage],
        ["final-overlay", finalOverlay],
        ["restart-button", restartButton]
    ];

    const missing = requiredElements
        .filter(item => !item[1])
        .map(item => item[0]);

    if (missing.length > 0) {

        throw new Error(
            "HTMLに必要な要素がありません:\n" +
            missing.join(", ")
        );
    }
}


// ========================================
// TEAM 適用
// ========================================

function applyTeam() {

    teamName.textContent = TEAM;

    runner.src = `img/character/${TEAM}team.png`;
    runner.alt = `Team ${TEAM}`;

    teamItems.forEach(item => {

        if (item.dataset.team === TEAM) {

            item.classList.add("active");

        } else {

            item.classList.remove("active");
        }
    });
}


// ========================================
// CSV LOADING（セクションごとに5ファイル）
// ========================================

async function loadAllSections() {

    questionText.textContent =
        "問題データを読み込んでいます……";

    for (let section = 1; section <= TOTAL_SECTIONS; section++) {

        const path = `data/section${section}.csv`;

        let response;

        try {

            response = await fetch(path, {
                cache: "no-store"
            });

        } catch (networkError) {

            throw new Error(
                `${path} の読み込みに失敗しました。\n` +
                `(ネットワークエラー: ${networkError.message})`
            );
        }

        if (!response.ok) {

            throw new Error(
                `${path} の読み込みに失敗しました。\n` +
                `HTTP Status: ${response.status}`
            );
        }

        const csvText = await response.text();

        if (!csvText.trim()) {

            throw new Error(
                `${path} が空です。`
            );
        }

        const rows = parseCSV(csvText, path);

        validateSectionQuestions(rows, section, path);

        sectionsData[section] = rows;
    }
}


// ========================================
// CSV PARSER
// ========================================

function parseCSV(csvText, path) {

    // UTF-8 BOM除去
    csvText = csvText.replace(/^\uFEFF/, "");

    const lines = csvText
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

    if (lines.length < 2) {

        throw new Error(
            `${path} に問題データがありません。`
        );
    }

    const headers = parseCSVLine(lines[0])
        .map(header =>
            header.replace(/^\uFEFF/, "").trim()
        );

    const requiredHeaders = ["id", "text", "answer"];

    for (const header of requiredHeaders) {

        if (!headers.includes(header)) {

            throw new Error(
                `${path} に「${header}」列がありません。`
            );
        }
    }

    const result = [];

    for (let i = 1; i < lines.length; i++) {

        const values = parseCSVLine(lines[i]);

        if (values.length === 1 && values[0].trim() === "") {
            continue;
        }

        const row = {};

        headers.forEach((header, index) => {
            row[header] = (values[index] ?? "").trim();
        });

        result.push(row);
    }

    return result;
}


// ========================================
// CSV LINE PARSER（クォート対応）
// ========================================

function parseCSVLine(line) {

    const result = [];

    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {

        const char = line[i];

        if (char === '"') {

            if (insideQuotes && line[i + 1] === '"') {

                current += '"';
                i++;

            } else {

                insideQuotes = !insideQuotes;
            }

        } else if (char === "," && !insideQuotes) {

            result.push(current);
            current = "";

        } else {

            current += char;
        }
    }

    result.push(current);

    return result;
}


// ========================================
// CSV VALIDATION（セクション単位）
// ========================================

function validateSectionQuestions(rows, section, path) {

    if (!Array.isArray(rows) || rows.length === 0) {

        throw new Error(
            `${path} に問題が1問もありません。`
        );
    }

    for (let i = 0; i < rows.length; i++) {

        const q = rows[i];

        if (!q.text) {

            throw new Error(
                `${path} ${i + 2}行目: text がありません。`
            );
        }

        if (!q.answer) {

            throw new Error(
                `${path} ${i + 2}行目: answer がありません。`
            );
        }
    }
}


// ========================================
// PREPARE SECTION
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

    sectionQuestions = sectionsData[currentSection] || [];

    if (sectionQuestions.length === 0) {

        showError(
            `SECTION ${currentSection} に問題がありません。`
        );

        return;
    }

    currentQuestionIndex = 0;

    sectionTotalChars = sectionQuestions.reduce(
        (sum, q) => sum + q.answer.length,
        0
    );

    sectionCharsTyped = 0;

    sectionNumber.textContent = currentSection;

    progressTotal.textContent = sectionQuestions.length;
    progressCurrent.textContent = "0";
    progressFill.style.width = "0%";

    if (progressPercent) {
        progressPercent.textContent = "0%";
    }

    updateScore();

    resetRunner();

    showQuestion();

    startCountdown();
}


// ========================================
// SHOW QUESTION
// ========================================

function showQuestion() {

    if (currentQuestionIndex >= sectionQuestions.length) {

        finishSection();
        return;
    }

    const question = sectionQuestions[currentQuestionIndex];

    currentAnswer = question.answer;
    currentPosition = 0;

    questionNumber.textContent =
        `QUESTION ${currentQuestionIndex + 1}`;

    questionText.textContent = question.text;

    typingInput.value = "";

    renderRomajiProgress();
    updateProgress();
}


// ========================================
// ROMAJI 進捗表示（入力済み／未入力）
// ========================================

function renderRomajiProgress() {

    if (!romajiProgress) {
        return;
    }

    const typed = currentAnswer.slice(0, currentPosition);
    const rest = currentAnswer.slice(currentPosition);

    romajiProgress.innerHTML = "";

    const typedSpan = document.createElement("span");
    typedSpan.className = "romaji-typed";
    typedSpan.textContent = typed;

    const restSpan = document.createElement("span");
    restSpan.className = "romaji-rest";
    restSpan.textContent = rest;

    romajiProgress.appendChild(typedSpan);
    romajiProgress.appendChild(restSpan);
}


// ========================================
// COUNTDOWN
// ========================================

function sleep(milliseconds) {

    return new Promise(resolve =>
        setTimeout(resolve, milliseconds)
    );
}


async function startCountdown() {

    gameStarted = false;
    typingInput.disabled = true;

    if (gameStateDisplay) {
        gameStateDisplay.textContent = "READY";
    }

    countdownOverlay.classList.add("active");
    countdownOverlay.setAttribute("aria-hidden", "false");

    const count = ["3", "2", "1", "GO!"];

    for (const value of count) {

        countdown.textContent = value;

        countdown.classList.remove("countdown-pop");

        void countdown.offsetWidth;

        countdown.classList.add("countdown-pop");

        await sleep(COUNTDOWN_TIME);
    }

    countdownOverlay.classList.remove("active");
    countdownOverlay.setAttribute("aria-hidden", "true");

    startGame();
}


// ========================================
// START GAME
// ========================================

function startGame() {

    if (sectionFinished) {
        return;
    }

    gameStarted = true;

    sectionStartTime = performance.now();

    startTimer();

    typingInput.disabled = false;
    typingInput.value = "";
    typingInput.focus();

    if (gameStateDisplay) {
        gameStateDisplay.textContent = "PLAYING";
    }
}


// ========================================
// TIMER
// ========================================

function startTimer() {

    stopTimer();

    timerInterval = setInterval(() => {

        if (!gameStarted) {
            return;
        }

        const elapsed = performance.now() - sectionStartTime;

        timerDisplay.textContent = formatTime(elapsed);

    }, 10);
}


function stopTimer() {

    if (timerInterval !== null) {

        clearInterval(timerInterval);
        timerInterval = null;
    }
}


// ========================================
// TIME FORMAT
// ========================================

function formatTime(milliseconds) {

    const totalSeconds = milliseconds / 1000;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor(milliseconds % 1000);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(ms).padStart(3, "0")
    );
}


// ========================================
// 1文字ずつのリアルタイム判定（keydownベース）
// ========================================

document.addEventListener("keydown", handleKeydown);


function handleKeydown(event) {

    if (!gameStarted || sectionFinished || processingAnswer) {
        return;
    }

    const key = event.key;

    // 修飾キー・特殊キー（Shift, Enter, Tab, 矢印キー等）は無視する。
    // answerに登場しうる文字（アルファベット・記号・スペース）は
    // すべて key.length === 1 になるため、ここで対象を絞り込める。
    if (key.length !== 1) {
        return;
    }

    // ブラウザの既定動作（typing-inputへの直接入力等）を止める。
    event.preventDefault();

    const target = currentAnswer[currentPosition];

    if (target === undefined) {
        return;
    }

    const inputChar = key.toLowerCase();
    const targetChar = target.toLowerCase();


    // ====================================
    // MISS
    // ====================================

    if (inputChar !== targetChar) {

        miss++;
        combo = 0;

        updateScore();
        showEffect("miss");

        return;
    }


    // ====================================
    // CORRECT
    // ====================================

    currentPosition++;
    score++;
    combo++;

    sectionCharsTyped++;

    updateScore();
    renderRomajiProgress();
    moveRunner();
    showEffect("good");

    if (combo >= 5 && combo % 5 === 0) {
        showEffect("boost");
    }

    if (currentPosition >= currentAnswer.length) {

        processingAnswer = true;

        setTimeout(() => {

            currentQuestionIndex++;
            processingAnswer = false;

            if (currentQuestionIndex >= sectionQuestions.length) {

                finishSection();

            } else {

                showQuestion();
            }

        }, NEXT_QUESTION_DELAY);
    }
}


// ========================================
// SCORE DISPLAY
// ========================================

function updateScore() {

    scoreDisplay.textContent = score;
    missDisplay.textContent = miss;
    comboDisplay.textContent = combo;

    if (accuracyDisplay) {

        const attempts = score + miss;

        const accuracy =
            attempts > 0
                ? Math.round((score / attempts) * 100)
                : 100;

        accuracyDisplay.textContent = `${accuracy}%`;
    }
}


// ========================================
// PROGRESS（問題数ベース）
// ========================================

function updateProgress() {

    const current = currentQuestionIndex;
    const total = sectionQuestions.length;

    progressCurrent.textContent = current;
    progressTotal.textContent = total;

    if (total <= 0) {

        progressFill.style.width = "0%";

        if (progressPercent) {
            progressPercent.textContent = "0%";
        }

        return;
    }

    const percent = (current / total) * 100;

    progressFill.style.width = `${percent}%`;

    if (progressPercent) {
        progressPercent.textContent = `${Math.round(percent)}%`;
    }
}


// ========================================
// RUNNER（セクション内の入力済み文字数ベース）
// ========================================

function resetRunner() {

    runner.style.left = "0%";
    runner.classList.remove("runner-finish");
}


function moveRunner() {

    if (sectionTotalChars <= 0) {
        return;
    }

    const percent = (sectionCharsTyped / sectionTotalChars) * 100;

    // 旗の直前まで走らせる（100%だと画像が画面外に出るため）。
    const safePercent = Math.min(percent, 94);

    runner.style.left = `${safePercent}%`;

    if (sectionCharsTyped >= sectionTotalChars) {

        runner.classList.add("runner-finish");
    }
}


// ========================================
// EFFECT
// ========================================

function showEffect(type) {

    let effect = null;

    if (type === "good") {

        effect = document.getElementById("good-effect");

    } else if (type === "miss") {

        effect = document.getElementById("miss-effect");

    } else if (type === "boost") {

        effect = document.getElementById("boost-effect");
    }

    if (!effect) {
        return;
    }

    effect.classList.remove("show");

    void effect.offsetWidth;

    effect.classList.add("show");
}


// ========================================
// FINISH SECTION
// ========================================

function finishSection() {

    if (sectionFinished) {
        return;
    }

    sectionFinished = true;
    gameStarted = false;

    stopTimer();

    typingInput.disabled = true;

    if (gameStateDisplay) {
        gameStateDisplay.textContent = "FINISH";
    }

    const elapsed = performance.now() - sectionStartTime;

    sectionTimes[currentSection - 1] = elapsed;

    totalScore += score;
    totalMiss += miss;

    timerDisplay.textContent = formatTime(elapsed);

    resultTime.textContent = formatTime(elapsed);
    resultScore.textContent = score;
    resultMiss.textContent = miss;

    resultOverlay.classList.add("active");
    resultOverlay.setAttribute("aria-hidden", "false");
}


// ========================================
// NEXT SECTION
// ========================================

nextSectionButton.addEventListener("click", () => {

    resultOverlay.classList.remove("active");
    resultOverlay.setAttribute("aria-hidden", "true");

    currentSection++;

    if (currentSection > TOTAL_SECTIONS) {

        finishRace();
        return;
    }

    prepareSection();
});


// ========================================
// FINAL RACE
// ========================================

function finishRace() {

    stopTimer();

    gameStarted = false;

    typingInput.disabled = true;

    if (gameStateDisplay) {
        gameStateDisplay.textContent = "RACE FINISH";
    }

    const totalElapsed = sectionTimes.reduce(
        (sum, t) => sum + (t || 0),
        0
    );

    finalTime.textContent = formatTime(totalElapsed);
    finalScore.textContent = totalScore;
    finalMiss.textContent = totalMiss;

    finalOverlay.classList.add("active");
    finalOverlay.setAttribute("aria-hidden", "false");
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
    resultOverlay.setAttribute("aria-hidden", "true");

    finalOverlay.classList.remove("active");
    finalOverlay.setAttribute("aria-hidden", "true");

    errorOverlay.classList.remove("active");
    errorOverlay.setAttribute("aria-hidden", "true");

    timerDisplay.textContent = "00:00.000";

    updateScore();

    prepareSection();
}


// ========================================
// ERROR DISPLAY
// ========================================

function showError(message) {

    stopTimer();

    gameStarted = false;

    typingInput.disabled = true;

    errorMessage.textContent = message;

    errorOverlay.classList.add("active");
    errorOverlay.setAttribute("aria-hidden", "false");
}


// ========================================
// ERROR RELOAD
// ========================================

errorReloadButton.addEventListener("click", () => {
    location.reload();
});


// ========================================
// STARTUP
// ========================================

async function initializeGame() {

    try {

        checkDOM();
        applyTeam();

        updateScore();

        timerDisplay.textContent = "00:00.000";

        console.log("========================================");
        console.log("KIR Typing Game START / TEAM:", TEAM);
        console.log("========================================");

        await loadAllSections();

        prepareSection();

    } catch (error) {

        console.error("ゲーム初期化エラー:", error);

        showError(
            "ゲームの初期化に失敗しました。\n\n" +
            error.message
        );
    }
}


// ========================================
// DOM READY
// ========================================

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", initializeGame);

} else {

    initializeGame();
}
