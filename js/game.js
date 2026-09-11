/* =========================================================
   KIR RECREATION TOURNAMENT 2026
   めちゃむずキーボード早打ち駅伝
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const GAME_ID = "KIR-KAI-2026";

const VALID_TEAMS = ["A", "B", "C", "D", "E", "F"];

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

function $(id) {
    return document.getElementById(id);
}

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
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error("HTMLに必要な要素がありません: " + missing.join(", "));
    }
}

/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {
    document.addEventListener("keydown", handleKeyDown);

    DOM.teamButtons.forEach(button => {
        button.addEventListener("click", () => {
            const team = button.dataset.team;
            if (!VALID_TEAMS.includes(team)) return;

            if (state.gameStarted || state.countdownRunning) return;

            state.team = team;
            applyTeam();
            updateTeamButtons();
            updateURLTeam(team);
        });
    });

    DOM.resultNextButton.addEventListener("click", handleResultNext);

    DOM.restartButton.addEventListener("click", () => {
        location.reload();
    });

    DOM.errorReloadButton.addEventListener("click", () => {
        location.reload();
    });

    window.addEventListener("blur", clearPressedKeys);
}

/* =========================================================
   TEAM
========================================================= */

function readTeamFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlTeam = String(params.get("team") || "").toUpperCase();

    if (VALID_TEAMS.includes(urlTeam)) {
        state.team = urlTeam;
    } else {
        state.team = "A";
    }
}

function updateURLTeam(team) {
    const url = new URL(window.location.href);
    url.searchParams.set("team", team);
    window.history.replaceState({}, "", url);
}

function applyTeam() {
    const team = state.team;

    DOM.teamName.textContent = `TEAM ${team}`;
    DOM.runnerImage.src = `img/character/${team}team.png`;
    DOM.runnerImage.alt = `Team ${team}`;

    updateTeamButtons();
}

function updateTeamButtons() {
    DOM.teamButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.team === state.team);
    });
}

/* =========================================================
   RESET
========================================================= */

function resetWholeGame() {
    stopTimer();

    state.sectionsData = [];
    state.currentSection = 0;
    state.sectionQuestions = [];
    state.currentQuestionIndex = 0;

    state.currentAnswer = "";
    state.currentPosition = 0;

    state.score = 0;
    state.miss = 0;
    state.combo = 0;

    state.totalScore = 0;
    state.totalMiss = 0;

    state.sectionTotalChars = 0;
    state.sectionCharsTyped = 0;

    state.sectionStartTime = 0;
    state.sectionTimes = [];

    state.gameStarted = false;
    state.sectionFinished = false;
    state.processingAnswer = false;
    state.countdownRunning = false;
    state.finalFinished = false;

    DOM.sectionNumber.textContent = "1";
    DOM.timer.textContent = "00:00.000";
    DOM.questionNumber.textContent = "1 / 1";
    DOM.questionText.textContent = "LOADING...";
    DOM.romajiProgress.textContent = "";

    updateHUD();
    updateProgress();
    resetRunner();

    hideAllOverlays();

    document.body.classList.add("ready");
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
    if (state.countdownRunning || state.gameStarted || state.sectionFinished) {
        return;
    }

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
   EFFECTS
========================================================= */

function showGoodEffect() {
    DOM.goodEffect.classList.remove("hidden");
    DOM.goodEffect.style.animation = "none";
    void DOM.goodEffect.offsetWidth;
    DOM.goodEffect.style.animation = "good-pop 0.3s ease-out";
    setTimeout(() => DOM.goodEffect.classList.add("hidden"), 300);
}

function showMissEffect() {
    DOM.missEffect.classList.remove("hidden");
    DOM.missEffect.style.animation = "none";
    void DOM.missEffect.offsetWidth;
    DOM.missEffect.style.animation = "miss-pop 0.3s ease-out";
    setTimeout(() => DOM.missEffect.classList.add("hidden"), 300);
}

function showBoostEffect() {
    DOM.boostEffect.classList.remove("hidden");
    DOM.boostEffect.style.animation = "none";
    void DOM.boostEffect.offsetWidth;
    DOM.boostEffect.style.animation = "boost-pop 0.5s ease-out";
    setTimeout(() => DOM.boostEffect.classList.add("hidden"), 500);
}

/* =========================================================
   KEYBOARD HIGHLIGHT
========================================================= */

function updateRequiredKey() {
    const nextChar = state.currentAnswer[state.currentPosition] || "";
    DOM.keys.forEach(key => {
        key.classList.remove("active");
        if (key.dataset.key === nextChar) key.classList.add("active");
    });
}

function updateKeyboardHighlight() {
    const nextChar = state.currentAnswer[state.currentPosition] || "";
    DOM.keys.forEach(key => {
        key.classList.remove("active");
        if (key.dataset.key === nextChar) key.classList.add("active");
    });
}

function flashPressedKey(char) {
    DOM.keys.forEach(key => {
        if (key.dataset.key === char) {
            key.classList.add("pressed");
            setTimeout(() => key.classList.remove("pressed"), 150);
        }
    });
}

function clearPressedKeys() {
    DOM.keys.forEach(key => key.classList.remove("pressed"));
}

/* =========================================================
   SECTION FINISH
========================================================= */

function finishSection() {
    stopTimer();
    state.sectionFinished = true;
    state.gameStarted = false;

    const elapsed = performance.now() - state.sectionStartTime;

    DOM.resultTime.textContent = formatTime(elapsed);
    DOM.resultScore.textContent = String(state.score);
    DOM.resultMiss.textContent = String(state.miss);

    DOM.resultOverlay.classList.remove("hidden");
}

function handleResultNext() {
    DOM.resultOverlay.classList.add("hidden");

    state.totalScore += state.score;
    state.totalMiss += state.miss;

    const nextSection = state.currentSection + 1;

    if (nextSection >= state.sectionsData.length) {
        finishRace();
        return;
    }

    prepareSection(nextSection);
}
/* =========================================================
   FINAL RESULT
========================================================= */

function finishRace() {
    stopTimer();
    state.finalFinished = true;

    DOM.finalTime.textContent = DOM.timer.textContent;
    DOM.finalScore.textContent = String(state.totalScore);
    DOM.finalMiss.textContent = String(state.totalMiss);

    DOM.finalOverlay.classList.remove("hidden");
}

/* =========================================================
   ERROR
========================================================= */

function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorOverlay.classList.remove("hidden");
}

/* =========================================================
   OVERLAY CONTROL
========================================================= */

function hideAllOverlays() {
    DOM.countdownOverlay.classList.add("hidden");
    DOM.errorOverlay.classList.add("hidden");
    DOM.resultOverlay.classList.add("hidden");
    DOM.finalOverlay.classList.add("hidden");
}

/* =========================================================
   UTIL
========================================================= */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
