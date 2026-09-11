/* =========================================================
   KIR RECREATION TOURNAMENT 2026
   めちゃむずキーボード早打ち駅伝

   IMPORTANT
   ---------------------------------------------------------
   CSV:
   section,title,question_no,display,answer

   display = 画面に表示する文字
   answer  = 実際に入力判定する文字

   進捗 = answer.length 基準
========================================================= */

"use strict";

/* =========================================================
   ★★★ 追加：normalizeText() ★★★
========================================================= */
function normalizeText(text) {
    if (!text) return "";
    return text
        .replace(/

\[半角スペース\]

/g, " ")
        .replace(/

\[全角スペース\]

/g, "　");
}

/* =========================================================
   CONFIG
========================================================= */

const GAME_ID = "KIR-KAI-2026";

const VALID_TEAMS = ["A","B","C","D","E","F"];

const SECTION_FILES = [
    "data/section1.csv",
    "data/section2.csv",
    "data/section3.csv",
    "data/section4.csv",
    "data/section5.csv",
    "data/section6.csv"
];

const COUNTDOWN_STEP = 1000;
const NEXT_QUESTION_DELAY = 200;
const NEXT_SECTION_DELAY = 500;

/* =========================================================
   DOM HELPER
========================================================= */
function $(id) { return document.getElementById(id); }

/* =========================================================
   DOM
========================================================= */

const DOM = {
    sectionNumber: $("section-number"),
    teamName: $("team-name"),
    timer: $("timer"),
    runner: $("runner"),
    runnerImage: $("runner-image"),
    finishFlag: $("finish-flag"),
    questionNumber: $("question-number"),
    questionText: $("question-text"),
    romajiProgress: $("romaji-progress"),
    score: $("score"),
    miss: $("miss"),
    combo: $("combo"),
    comboSideValue: $("combo-side-value"),
    accuracy: $("accuracy"),
    progressPercent: $("progress-percent"),
    progressFill: $("progress-fill"),
    progressCurrent: $("progress-current"),
    progressTotal: $("progress-total"),
    goodEffect: $("good-effect"),
    missEffect: $("miss-effect"),
    boostEffect: $("boost-effect"),
    countdownOverlay: $("countdown-overlay"),
    countdown: $("countdown"),
    errorOverlay: $("error-overlay"),
    errorMessage: $("error-message"),
    errorReloadButton: $("error-reload-button"),
    resultOverlay: $("result-overlay"),
    resultTime: $("result-time"),
    resultScore: $("result-score"),
    resultMiss: $("result-miss"),
    resultNextButton: $("result-next-button"),
    finalOverlay: $("final-overlay"),
    finalTime: $("final-time"),
    finalScore: $("final-score"),
    finalMiss: $("final-miss"),
    restartButton: $("restart-button"),
    typingInput: $("typing-input"),
    teamButtons: document.querySelectorAll(".team-select"),
    keys: document.querySelectorAll(".key")
};

/* =========================================================
   STATE
========================================================= */

const state = {
    initialized: false,
    team: "A",
    sectionsData: [],
    currentSection: 0,
    sectionQuestions: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    currentAnswer: "",
    currentPosition: 0,
    score: 0,
    miss: 0,
    combo: 0,
    totalScore: 0,
    totalMiss: 0,
    sectionTotalChars: 0,
    sectionCharsTyped: 0,
    sectionStartTime: 0,
    sectionTimes: [],
    timerInterval: null,
    gameStarted: false,
    sectionFinished: false,
    processingAnswer: false,
    countdownRunning: false,
    finalFinished: false
};

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    if (state.initialized) return;
    state.initialized = true;

    try {
        checkDOM();
        bindEvents();
        readTeamFromURL();
        applyTeam();
        resetWholeGame();
        loadAllSections();
    } catch (error) {
        console.error(error);
        showError(error.message || "ゲームを初期化できませんでした。");
    }
}

/* =========================================================
   DOM CHECK
========================================================= */

function checkDOM() {
    const required = {
        sectionNumber: DOM.sectionNumber,
        teamName: DOM.teamName,
        timer: DOM.timer,
        runner: DOM.runner,
        runnerImage: DOM.runnerImage,
        questionNumber: DOM.questionNumber,
        questionText: DOM.questionText,
        romajiProgress: DOM.romajiProgress,
        score: DOM.score,
        miss: DOM.miss,
        combo: DOM.combo,
        accuracy: DOM.accuracy,
        progressPercent: DOM.progressPercent,
        progressFill: DOM.progressFill,
        progressCurrent: DOM.progressCurrent,
        progressTotal: DOM.progressTotal,
        countdownOverlay: DOM.countdownOverlay,
        countdown: DOM.countdown,
        errorOverlay: DOM.errorOverlay,
        errorMessage: DOM.errorMessage,
        errorReloadButton: DOM.errorReloadButton,
        resultOverlay: DOM.resultOverlay,
        resultTime: DOM.resultTime,
        resultScore: DOM.resultScore,
        resultMiss: DOM.resultMiss,
        resultNextButton: DOM.resultNextButton,
        finalOverlay: DOM.finalOverlay,
        finalTime: DOM.finalTime,
        finalScore: DOM.finalScore,
        finalMiss: DOM.finalMiss,
        restartButton: DOM.restartButton,
        typingInput: DOM.typingInput
    };

    const missing = Object.entries(required)
        .filter(([, el]) => !el)
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error("HTMLに必要な要素がありません: " + missing.join(", "));
    }
}
/* =========================================================
   LOAD ALL CSV
========================================================= */

async function loadAllSections() {

    DOM.questionText.textContent = "LOADING...";

    const loadedSections = [];

    try {
        for (let index = 0; index < SECTION_FILES.length; index++) {

            const file = SECTION_FILES[index];

            const response = await fetch(`${file}?v=${Date.now()}`);

            if (!response.ok) {
                throw new Error(
                    `CSVを読み込めませんでした。\n${file}\nHTTP ${response.status}`
                );
            }

            const text = await response.text();

            const rows = parseCSV(text);

            validateCSV(rows, index + 1, file);

            /* ★★★ 修正：display / answer を normalizeText ★★★ */
            const normalizedRows = rows.map(r => ({
                ...r,
                display: normalizeText(r.display),
                answer: normalizeText(r.answer)
            }));

            loadedSections.push(normalizedRows);
        }

        state.sectionsData = loadedSections;

        if (state.sectionsData.length === 0) {
            throw new Error("セクションデータがありません。");
        }

        prepareSection(0);

        document.body.classList.add("ready");

        focusTypingInput();

    } catch (error) {
        console.error(error);
        showError(error.message || "CSVの読み込みに失敗しました。");
    }
}

/* =========================================================
   PREPARE SECTION
========================================================= */

function prepareSection(sectionIndex) {

    if (sectionIndex < 0 || sectionIndex >= state.sectionsData.length) {
        finishRace();
        return;
    }

    state.currentSection = sectionIndex;

    state.sectionQuestions = state.sectionsData[sectionIndex];

    state.currentQuestionIndex = 0;

    state.sectionTotalChars = state.sectionQuestions.reduce(
        (total, question) => total + String(question.answer ?? "").length,
        0
    );

    resetSectionStats();
    resetRunner();

    DOM.sectionNumber.textContent = String(sectionIndex + 1);

    DOM.progressTotal.textContent = String(state.sectionTotalChars);
    DOM.progressCurrent.textContent = "0";
    DOM.progressPercent.textContent = "0%";
    DOM.progressFill.style.width = "0%";

    showQuestion();

    document.body.classList.add("ready");
}

/* =========================================================
   SHOW QUESTION（★★★ display を表示するよう修正 ★★★）
========================================================= */

function showQuestion() {

    const question =
        state.sectionsData[state.currentSection][state.currentQuestionIndex];

    if (!question) return;

    state.currentAnswer = question.answer || "";
    state.currentPosition = 0;

    /* ★★★ 修正：QUESTION欄には display を表示 ★★★ */
    DOM.questionText.textContent = question.display || "";

    renderRomajiProgress();
    updateKeyboardHighlight();
}

/* =========================================================
   ROMAJI PROGRESS
========================================================= */

function renderRomajiProgress() {

    const answer = state.currentAnswer;
    const position = state.currentPosition;

    if (!answer) {
        DOM.romajiProgress.textContent = "";
        return;
    }

    const typed = answer.slice(0, position);
    const current = answer[position] ?? "";
    const rest = answer.slice(position + 1);

    DOM.romajiProgress.innerHTML = "";

    const typedSpan = document.createElement("span");
    typedSpan.className = "typed";
    typedSpan.textContent = typed;

    const currentSpan = document.createElement("span");
    currentSpan.className = "current";
    currentSpan.textContent = current;

    const restSpan = document.createElement("span");
    restSpan.textContent = rest;

    DOM.romajiProgress.appendChild(typedSpan);
    DOM.romajiProgress.appendChild(currentSpan);
    DOM.romajiProgress.appendChild(restSpan);
}

/* =========================================================
   KEYBOARD INPUT
========================================================= */

function handleKeyDown(event) {

    if (event.ctrlKey || event.altKey || event.metaKey) return;

    if (event.key === "Enter") {

        event.preventDefault();

        if (state.finalFinished) {
            location.reload();
            return;
        }

        if (!state.gameStarted && !state.countdownRunning && !state.sectionFinished) {
            startCountdown();
            return;
        }

        if (state.sectionFinished) {
            handleResultNext();
            return;
        }

        return;
    }

    if (typeof event.key !== "string" || event.key.length !== 1) return;

    if (!state.gameStarted || state.sectionFinished || state.processingAnswer || state.countdownRunning) {
        return;
    }

    flashPressedKey(event.key);

    checkCharacter(event.key);
}

/* =========================================================
   CHECK CHARACTER
========================================================= */

function checkCharacter(char) {

    const expected = state.currentAnswer[state.currentPosition];

    if (char === expected) {
        handleCorrect();
    } else {
        handleMiss();
    }
}

/* =========================================================
   CORRECT
========================================================= */

function handleCorrect() {

    state.currentPosition++;
    state.score++;
    state.combo++;
    state.sectionCharsTyped++;

    showGoodEffect();

    if (state.combo > 0 && state.combo % 10 === 0) {
        showBoostEffect();
    }

    updateHUD();
    updateProgress();
    renderRomajiProgress();
    updateRequiredKey();

    if (state.currentPosition >= state.currentAnswer.length) {

        state.processingAnswer = true;

        window.setTimeout(() => {

            state.currentQuestionIndex++;

            if (state.currentQuestionIndex >= state.sectionQuestions.length) {
                finishSection();
                return;
            }

            state.processingAnswer = false;
            showQuestion();

        }, NEXT_QUESTION_DELAY);
    }
}

/* =========================================================
   MISS
========================================================= */

function handleMiss() {

    state.miss++;
    state.combo = 0;

    showMissEffect();
    updateHUD();
}

/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    DOM.score.textContent = String(state.score);
    DOM.miss.textContent = String(state.miss);
    DOM.combo.textContent = String(state.combo);
    DOM.comboSideValue.textContent = String(state.combo);

    const attempts = state.score + state.miss;
    const accuracy = attempts === 0 ? 100 : (state.score / attempts) * 100;

    DOM.accuracy.textContent = `${accuracy.toFixed(1)}%`;
}

/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const total = state.sectionTotalChars;
    const current = Math.min(state.sectionCharsTyped, total);
    const percent = total === 0 ? 0 : (current / total) * 100;

    DOM.progressCurrent.textContent = String(current);
    DOM.progressTotal.textContent = String(total);
    DOM.progressPercent.textContent = `${percent.toFixed(1)}%`;
    DOM.progressFill.style.width = `${percent}%`;

    updateRunner(percent);
}

/* =========================================================
   RUNNER
========================================================= */

function resetRunner() {
    DOM.runner.style.left = "0%";
    DOM.runner.style.transform = "translateX(0)";
}

function updateRunner(percent) {
    const runnerPercent = Math.min(Math.max(percent * 0.92, 0), 92);
    DOM.runner.style.left = `${runnerPercent}%`;
}

/* =========================================================
   COUNTDOWN
========================================================= */

async function startCountdown() {

    if (state.countdownRunning || state.gameStarted || state.sectionFinished) return;

    state.countdownRunning = true;

    DOM.countdownOverlay.classList.remove("hidden");

    const sequence = ["3", "2", "1", "GO!"];

    for (let i = 0; i < sequence.length; i++) {

        DOM.countdown.textContent = sequence[i];

        DOM.countdown.style.animation = "none";
        void DOM.countdown.offsetWidth;
        DOM.countdown.style.animation = "countdown-pop 0.9s ease-out";

        await sleep(COUNTDOWN_STEP);
    }

    DOM.countdownOverlay.classList.add("hidden");

    state.countdownRunning = false;
    state.gameStarted = true;
    state.sectionFinished = false;

    document.body.classList.remove("ready");

    state.sectionStartTime = performance.now();

    startTimer();
    focusTypingInput();
}

/* =========================================================
   TIMER
========================================================= */

function startTimer() {
    stopTimer();
    state.sectionStartTime = performance.now();
    updateTimer();
    state.timerInterval = window.setInterval(updateTimer, 10);
}

function updateTimer() {
    if (!state.gameStarted) return;
    const elapsed = performance.now() - state.sectionStartTime;
    DOM.timer.textContent = formatTime(elapsed);
}

function stopTimer() {
    if (state.timerInterval !== null) {
        window.clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

function formatTime(milliseconds) {
    const ms = Math.max(0, Math.floor(milliseconds));
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(millis).padStart(3, "0")
    );
}

/* =========================================================
   TYPING INPUT（完全非表示）
========================================================= */

function focusTypingInput() {
    if (DOM.typingInput) {
        DOM.typingInput.focus();
    }
}

/* =========================================================
   SLEEP
========================================================= */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
