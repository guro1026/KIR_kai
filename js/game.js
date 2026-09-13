"use strict";


// =========================================================
// SUPABASE
// =========================================================

const SUPABASE_URL = "https://bytvpjhdlfwcwcivrhwv.supabase.co";

// ここにSupabaseの「Publishable key」を入れる
// Secret keyは絶対に入れない。
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Zkax9vIUNFRv_oBEGlIwfg_dXy545ln";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


const GAME_ID = "KIR-KAI-2026";


const VALID_TEAMS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
];


const SECTION_FILES = [
    "data/section1.csv",
    "data/section2.csv",
    "data/section3.csv",
    "data/section4.csv",
    "data/section5.csv",
    "data/section6.csv"    
];


const SECTION_TIME = 150000;
const COUNTDOWN_TIME = 1000;
const NEXT_QUESTION_DELAY = 150;
const NEXT_SECTION_DELAY = 300;


function $(id) {
    return document.getElementById(id);
}


const DOM = {
    sectionNumber: $("section-number"),
    teamName: $("team-name"),
    timer: $("timer"),
    runner: $("runner"),
    runnerImage: $("runner-image"),
    finishFlag: $("finish-flag"),
    questionNumber: $("question-number"),
    questionGenre: $("question-genre"),
    questionText: $("question-text"),
    romajiProgress: $("romaji-progress"),
    nextKey: $("next-key"),
    nextKeyCombo: $("next-key-combo"),
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
    titleOverlay: $("title-overlay"),
    titleSection: $("title-section"),
    titlePressEnter: $("title-press-enter"),
    errorOverlay: $("error-overlay"),
    errorMessage: $("error-message"),
    errorReloadButton: $("error-reload-button"),
    resultOverlay: $("result-overlay"),
    resultSection: $("result-section"),
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


const state = {
    initialized: false,
    dataReady: false,
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
    sectionElapsed: 0,
    timerInterval: null,
    sectionActive: false,
    gameStarted: false,
    sectionFinished: false,
    titleScreen: true,
    countdownRunning: false,
    processingAnswer: false,
    timeExpired: false,
    finalFinished: false,
    savedQuestionIndex: 0,
    savedInputPosition: 0,
	sectionTimes: [],
	sectionScores: []
};


function checkDOM() {

    const required = [
        "section-number", "team-name", "timer",
        "runner", "runner-image",
        "question-number", "question-genre", "question-text", "romaji-progress",
        "next-key", "next-key-combo",
        "score", "miss", "combo", "combo-side-value", "accuracy",
        "progress-percent", "progress-fill", "progress-current", "progress-total",
        "good-effect", "miss-effect", "boost-effect",
        "countdown-overlay", "countdown",
        "title-overlay", "title-section", "title-press-enter",
        "error-overlay", "error-message", "error-reload-button",
        "result-overlay", "result-section", "result-time", "result-score", "result-miss", "result-next-button",
        "final-overlay", "final-time", "final-score", "final-miss", "restart-button",
        "typing-input"
    ];

    const missing = [];

    required.forEach(id => {
        if (!$(id)) {
            missing.push(id);
        }
    });

    if (missing.length > 0) {
        throw new Error("HTML要素が見つかりません:\n\n" + missing.join("\n"));
    }
}


document.addEventListener("DOMContentLoaded", initialize);


async function initialize() {
    try {
        checkDOM();
        bindEvents();
        readTeamFromURL();
        applyTeam();
        resetWholeGame();
        await loadAllSections();
        state.initialized = true;
        console.log(`[${GAME_ID}] initialized`);
    }
    catch (error) {
        console.error(error);
        showError(error instanceof Error ? error.message : String(error));
    }
}


function bindEvents() {

    document.addEventListener("keydown", handleKeyDown);

    DOM.teamButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (state.sectionActive || state.countdownRunning) {
                return;
            }
            const team = String(button.dataset.team || "").toUpperCase();
            if (VALID_TEAMS.includes(team)) {
                state.team = team;
                applyTeam();
            }
        });
    });

    DOM.resultNextButton.addEventListener("click", handleResultNext);

    DOM.restartButton.addEventListener("click", () => {
        location.reload();
    });

    DOM.errorReloadButton.addEventListener("click", () => {
        location.reload();
    });

    DOM.keys.forEach(key => {
        key.addEventListener("mousedown", event => {
            event.preventDefault();
        });
    });

    window.addEventListener("blur", clearPressedKeys);
}


function handleKeyDown(event) {

    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    if (event.key === "Enter" && state.finalFinished) {
        event.preventDefault();
        location.reload();
        return;
    }

    if (event.key === "Enter" && state.titleScreen) {
        event.preventDefault();
        if (state.dataReady && !state.countdownRunning) {
            startCountdown();
        }
        return;
    }

    if (event.key === "Enter" && state.sectionFinished) {
        event.preventDefault();
        handleResultNext();
        return;
    }

    if (!state.gameStarted || !state.sectionActive || state.countdownRunning || state.sectionFinished || state.finalFinished) {
        return;
    }

    if (event.key === "Enter") {
        event.preventDefault();
        return;
    }

    if (event.key === "Shift") {
        return;
    }

    const key = normalizeKey(event.key);

    if (!key) {
        return;
    }

    if (key.length !== 1) {
        return;
    }

    event.preventDefault();

    flashPressedKey(key);
    checkCharacter(key);
}


function normalizeKey(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).toLowerCase();
}


function readTeamFromURL() {
    try {
        const params = new URLSearchParams(window.location.search);
        const team = String(params.get("team") || "A").toUpperCase();
        if (VALID_TEAMS.includes(team)) {
            state.team = team;
        }
    }
    catch (error) {
        console.warn("URLからチームを取得できません:", error);
        state.team = "A";
    }
}


/* =========================================================
   HEX -> RGB
   --cyan-r/g/b は style.css の rgba() 系（枠線・グロー・
   進捗バーなど）が参照している。--cyan と必ずセットで更新する。
========================================================= */

function hexToRgb(hex) {

    const clean = String(hex || "").replace("#", "");
    const bigint = parseInt(clean, 16);

    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}


function applyTeam() {

    const TEAM_DISPLAY_NAME = {
        A: "TEAM BLUE",
        B: "TEAM RED",
        C: "TEAM GREEN",
        D: "TEAM YELLOW",
        E: "TEAM PURPLE",
        F: "TEAM SKYBLUE"
    };

    const TEAM_UI_COLOR = {
        A: "#00aaff",
        B: "#ff3333",
        C: "#33cc33",
        D: "#ffdd00",
        E: "#aa33ff",
        F: "#33ddff"
    };

    const teamHex = TEAM_UI_COLOR[state.team];
    const teamRgb = hexToRgb(teamHex);

    document.documentElement.style.setProperty("--cyan", teamHex);
    document.documentElement.style.setProperty("--cyan-r", teamRgb.r);
    document.documentElement.style.setProperty("--cyan-g", teamRgb.g);
    document.documentElement.style.setProperty("--cyan-b", teamRgb.b);

    DOM.teamName.textContent = TEAM_DISPLAY_NAME[state.team];

    DOM.teamName.classList.remove("team-A", "team-B", "team-C", "team-D", "team-E", "team-F");
    DOM.teamName.classList.add(`team-${state.team}`);

    const mainTitle = document.querySelector(".main-title");
    if (mainTitle) {
        mainTitle.classList.remove("title-A", "title-B", "title-C", "title-D", "title-E", "title-F");
        mainTitle.classList.add(`title-${state.team}`);
        mainTitle.innerHTML = `めちゃむずキーボード早打ち<span>駅伝</span> - ${TEAM_DISPLAY_NAME[state.team]}`;
    }

    DOM.runnerImage.src = `img/character/${state.team}team.png`;
    DOM.runnerImage.alt = TEAM_DISPLAY_NAME[state.team];

    DOM.teamButtons.forEach(button => {
        button.classList.toggle("active", String(button.dataset.team).toUpperCase() === state.team);
    });
}


function resetWholeGame() {

    stopTimer();

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
    state.sectionElapsed = 0;
    state.sectionTimes = [];
	state.sectionScores = [];    
    state.sectionActive = false;
    state.gameStarted = false;
    state.sectionFinished = false;
    state.titleScreen = true;
    state.countdownRunning = false;
    state.processingAnswer = false;
    state.timeExpired = false;
    state.finalFinished = false;
    state.savedQuestionIndex = 0;
    state.savedInputPosition = 0;

    hideAllOverlays();

    document.body.classList.add("ready");

    updateSectionNumber();
    resetHUD();
    resetProgress();
    resetRunner();
    resetQuestionUI();
    resetTimer();

    focusInput();
}


function resetTimer() {
    DOM.timer.textContent = "00:00.000";
}


function resetQuestionUI() {
    DOM.questionNumber.textContent = "0 / 0";
    DOM.questionGenre.textContent = "---";
    DOM.questionText.textContent = "LOADING...";
    DOM.romajiProgress.textContent = "";
    DOM.nextKey.textContent = "—";
    DOM.nextKeyCombo.textContent = "—";
}


async function loadAllSections() {

    const loadedSections = [];

    try {
        for (let index = 0; index < SECTION_FILES.length; index++) {

            const file = SECTION_FILES[index];

            console.log(`[KIR CSV] loading: ${file}`);

            const response = await fetch(`${file}?v=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`CSV読み込み失敗\n\nファイル: ${file}\nHTTP: ${response.status}`);
            }

            const text = await response.text();
            const questions = parseCSV(text);

            if (questions.length === 0) {
                throw new Error(`${file}\n\n有効な問題がありません。`);
            }

            loadedSections.push(questions);

            console.log(`[KIR CSV] ${file}: ${questions.length}問`);
        }

        state.sectionsData = loadedSections;
        state.dataReady = true;

        prepareSection(0);
        showSectionTitle();
    }
    catch (error) {
        console.error(error);
        showError(error instanceof Error ? error.message : String(error));
    }
}


function parseCSV(text) {

    text = String(text || "").replace(/^\uFEFF/, "");
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            cell += '"';
            i++;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            row.push(cell);
            cell = "";
            continue;
        }

        if (char === "\n" && !inQuotes) {
            row.push(cell);
            cell = "";
            if (row.some(value => String(value).trim() !== "")) {
                rows.push(row);
            }
            row = [];
            continue;
        }

        cell += char;
    }

    row.push(cell);

    if (row.some(value => String(value).trim() !== "")) {
        rows.push(row);
    }

    if (rows.length < 2) {
        throw new Error("CSVにデータがありません。");
    }

    const headers = rows[0].map(value => String(value).replace(/^\uFEFF/, "").trim().toLowerCase());

    console.log("[KIR CSV HEADER]", headers);

    const requiredHeaders = ["question_no", "section", "genre", "display", "answer"];

    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

    if (missingHeaders.length > 0) {
        throw new Error(
            "CSVのヘッダーが新仕様ではありません。\n\n" +
            "必要:\n" +
            "question_no, section, genre, display, answer\n\n" +
            "不足:\n" +
            missingHeaders.join(", ") +
            "\n\n" +
            "実際:\n" +
            headers.join(", ")
        );
    }

    const questionNoIndex = headers.indexOf("question_no");
    const sectionIndex = headers.indexOf("section");
    const genreIndex = headers.indexOf("genre");
    const displayIndex = headers.indexOf("display");
    const answerIndex = headers.indexOf("answer");

    const result = [];

    for (let i = 1; i < rows.length; i++) {

        const currentRow = rows[i];

        if (currentRow.length === 0) {
            continue;
        }

        const questionNo = String(currentRow[questionNoIndex] ?? "").trim();
        const section = String(currentRow[sectionIndex] ?? "").trim();
        const genre = decodeSpecialSpaces(String(currentRow[genreIndex] ?? "").trim());
        const display = decodeSpecialSpaces(String(currentRow[displayIndex] ?? "").trim());
        const answer = decodeSpecialSpaces(String(currentRow[answerIndex] ?? "").trim()).toLowerCase();

        if (!questionNo && !section && !genre && !display && !answer) {
            continue;
        }

        if (!answer) {
            console.warn(`[KIR CSV] ${i + 1}行目: answerが空`);
            continue;
        }

        result.push({
            questionNo: questionNo || String(i),
            section: section,
            genre: genre,
            display: display,
            answer: answer
        });
    }

    if (result.length === 0) {
        throw new Error("CSVから有効な問題を読み込めませんでした。");
    }

    console.log(`[KIR CSV] ${result.length}問読み込み完了`);

    return result;
}


function decodeSpecialSpaces(value) {
    return String(value)
        .replace(/\[半角スペース\]/g, " ")
        .replace(/\[全角スペース\]/g, " ");
}


function prepareSection(sectionIndex) {

    stopTimer();

    if (sectionIndex < 0 || sectionIndex >= state.sectionsData.length) {
        finishRace();
        return;
    }

    state.currentSection = sectionIndex;
    state.sectionQuestions = state.sectionsData[sectionIndex];

    state.currentQuestionIndex = 0;
    state.currentAnswer = "";
    state.currentPosition = 0;

    state.score = 0;
    state.miss = 0;
    state.combo = 0;

    state.sectionCharsTyped = 0;
    state.sectionTotalChars = state.sectionQuestions.reduce((total, question) => total + question.answer.length, 0);

    state.sectionStartTime = 0;
    state.sectionElapsed = 0;

    state.sectionActive = false;
    state.gameStarted = false;
    state.sectionFinished = false;
    state.titleScreen = true;
    state.countdownRunning = false;
    state.processingAnswer = false;
    state.timeExpired = false;

    state.savedQuestionIndex = 0;
    state.savedInputPosition = 0;

    clearInput();
    clearPressedKeys();

    updateSectionNumber();
    resetHUD();
    resetProgress();
    resetRunner();
    resetTimer();
    showQuestion();

    showSectionTitle();
}


function showSectionTitle() {

    const sectionNo = state.currentSection + 1;

    DOM.titleSection.textContent = `第${sectionNo}区スタート`;
    DOM.titlePressEnter.textContent = "PRESS ENTER";

    DOM.titleOverlay.classList.remove("hidden");
    DOM.countdownOverlay.classList.add("hidden");
    DOM.resultOverlay.classList.add("hidden");

    state.titleScreen = true;

    document.body.classList.add("ready");

    focusInput();
}


function showQuestion() {

    const question = state.sectionQuestions[state.currentQuestionIndex];

    if (!question) {
        finishSection();
        return;
    }

    DOM.questionGenre.textContent = question.genre || "---";
    DOM.questionText.textContent = question.display;

    state.currentAnswer = String(question.answer || "").toLowerCase();
    state.currentPosition = 0;

    DOM.questionNumber.textContent = `${state.currentQuestionIndex + 1} / ${state.sectionQuestions.length}`;

    updateRomajiProgress();
    updateRequiredKey();

    clearInput();
    focusInput();
}


function updateRomajiProgress() {

    const answer = state.currentAnswer;
    const position = state.currentPosition;

    if (!answer) {
        DOM.romajiProgress.textContent = "";
        return;
    }

    DOM.romajiProgress.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < answer.length; i++) {

        const span = document.createElement("span");
        span.textContent = answer[i];

        if (i < position) {
            span.className = "typed";
        }
        else if (i === position) {
            span.className = "current";
        }
        else {
            span.className = "remaining";
        }

        fragment.appendChild(span);
    }

    DOM.romajiProgress.appendChild(fragment);
}


function checkCharacter(input) {

    if (state.processingAnswer) {
        return;
    }

    if (!state.gameStarted || !state.sectionActive) {
        return;
    }

    const expected = state.currentAnswer[state.currentPosition];

    if (!expected) {
        return;
    }

    if (input === expected) {
        handleCorrect();
    }
    else {
        handleMiss();
    }
}


function handleCorrect() {

    state.currentPosition++;
    state.sectionCharsTyped++;
    state.combo++;

    state.score += 10;

    if (state.combo > 1) {
        state.score += Math.min(state.combo, 20);
    }

    flashEffect(DOM.goodEffect);

    if (state.combo > 0 && state.combo % 10 === 0) {
        flashEffect(DOM.boostEffect);
    }

    updateHUD();
    updateProgress();
    updateRomajiProgress();
    updateRequiredKey();

    if (state.currentPosition >= state.currentAnswer.length) {
        completeQuestion();
    }
}


function handleMiss() {

    state.miss++;
    state.combo = 0;

    flashEffect(DOM.missEffect);

    updateHUD();
}


async function completeQuestion() {

    if (state.processingAnswer) {
        return;
    }

    state.processingAnswer = true;

    const isLastQuestion = state.currentQuestionIndex >= state.sectionQuestions.length - 1;

    await sleep(NEXT_QUESTION_DELAY);

    if (state.timeExpired) {
        state.processingAnswer = false;
        finishSection();
        return;
    }

    if (isLastQuestion) {
        state.processingAnswer = false;
        finishSection();
        return;
    }

    state.currentQuestionIndex++;
    state.processingAnswer = false;

    showQuestion();
}


async function startCountdown() {

    if (state.countdownRunning || state.sectionActive || state.sectionFinished || state.finalFinished) {
        return;
    }

    if (!state.dataReady || state.sectionQuestions.length === 0) {
        return;
    }

    state.titleScreen = false;
    state.countdownRunning = true;

    DOM.titleOverlay.classList.add("hidden");
    DOM.countdownOverlay.classList.remove("hidden");

    const sequence = ["3", "2", "1", "GO!!"];

    for (let i = 0; i < sequence.length; i++) {

        if (state.sectionFinished) {
            state.countdownRunning = false;
            return;
        }

        DOM.countdown.textContent = sequence[i];

        DOM.countdown.style.animation = "none";
        void DOM.countdown.offsetWidth;
        DOM.countdown.style.animation = "";

        if (sequence[i] === "GO!!") {
            await sleep(500);
        }
        else {
            await sleep(COUNTDOWN_TIME);
        }
    }

    DOM.countdownOverlay.classList.add("hidden");

    state.countdownRunning = false;

    startSection();
}


function startSection() {

    if (state.sectionFinished) {
        return;
    }

    state.sectionActive = true;
    state.gameStarted = true;
    state.timeExpired = false;

    document.body.classList.remove("ready");

    state.sectionStartTime = performance.now();

    startTimer();

    focusInput();
}


function startTimer() {

    stopTimer();

    state.sectionStartTime = performance.now();
    state.sectionElapsed = 0;

    updateTimer();

    state.timerInterval = setInterval(updateTimer, 10);
}


function updateTimer() {

    if (!state.sectionActive || !state.sectionStartTime) {
        return;
    }

    const elapsed = performance.now() - state.sectionStartTime;

    state.sectionElapsed = elapsed;

    DOM.timer.textContent = formatTime(elapsed);

    if (elapsed >= SECTION_TIME && !state.timeExpired) {
        handleTimeExpired();
    }
}


function handleTimeExpired() {

    if (!state.sectionActive || state.timeExpired) {
        return;
    }

    state.savedQuestionIndex = state.currentQuestionIndex;
    state.savedInputPosition = state.currentPosition;

    state.timeExpired = true;
    state.gameStarted = false;

    clearInput();
    clearPressedKeys();

    if (state.processingAnswer) {
        return;
    }

    finishSection();
}


function stopTimer() {

    if (state.timerInterval !== null) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}


function finishSection() {

    if (state.sectionFinished) {
        return;
    }

    stopTimer();

    if (state.sectionStartTime) {
        state.sectionElapsed = Math.min(performance.now() - state.sectionStartTime, SECTION_TIME);
    }

    state.sectionActive = false;
    state.gameStarted = false;
    state.countdownRunning = false;
    state.sectionFinished = true;
    state.titleScreen = false;

    clearInput();
    clearPressedKeys();

    if (state.timeExpired) {
        state.currentQuestionIndex = state.savedQuestionIndex;
        state.currentPosition = state.savedInputPosition;

        updateRomajiProgress();
        updateRequiredKey();
    }

    DOM.resultSection.textContent = String(state.currentSection + 1);
    DOM.resultTime.textContent = formatTime(state.sectionElapsed);
    DOM.resultScore.textContent = String(state.score);
    DOM.resultMiss.textContent = String(state.miss);

    DOM.titleOverlay.classList.add("hidden");
    DOM.countdownOverlay.classList.add("hidden");
    DOM.resultOverlay.classList.remove("hidden");

    updateHUD();
}


function handleResultNext() {

    if (!state.sectionFinished) {
        return;
    }

	state.totalScore += state.score;
	state.totalMiss += state.miss;

	state.sectionTimes[state.currentSection] = state.sectionElapsed;
	state.sectionScores[state.currentSection] = state.score;


    DOM.resultOverlay.classList.add("hidden");

    const nextSection = state.currentSection + 1;

    if (nextSection >= state.sectionsData.length) {
        finishRace();
        return;
    }

    setTimeout(() => {
        prepareSection(nextSection);
    }, NEXT_SECTION_DELAY);
}


async function finishRace() {
    stopTimer();
    state.sectionActive = false;
    state.gameStarted = false;
    state.sectionFinished = false;
    state.titleScreen = false;
    state.finalFinished = true;

    clearInput();
    clearPressedKeys();

    const totalTime = state.sectionTimes.reduce(
        (total, time) => total + (Number(time) || 0),
        0
    );

    DOM.finalTime.textContent = formatTime(totalTime);
    DOM.finalScore.textContent = String(state.totalScore);
    DOM.finalMiss.textContent = String(state.totalMiss);

    DOM.finalOverlay.classList.remove("hidden");

    // Supabaseへ最終結果を保存
    await saveGameResult(totalTime);
}
// =========================================================
// SUPABASE RESULT SAVE
// =========================================================

async function saveGameResult(totalTime) {

    const result = {
        team: state.team,

        section_1_time: Number(state.sectionTimes[0] || 0),
        section_1_score: Number(state.sectionScores[0] || 0),

        section_2_time: Number(state.sectionTimes[1] || 0),
        section_2_score: Number(state.sectionScores[1] || 0),

        section_3_time: Number(state.sectionTimes[2] || 0),
        section_3_score: Number(state.sectionScores[2] || 0),

        section_4_time: Number(state.sectionTimes[3] || 0),
        section_4_score: Number(state.sectionScores[3] || 0),

        section_5_time: Number(state.sectionTimes[4] || 0),
        section_5_score: Number(state.sectionScores[4] || 0),

        section_6_time: Number(state.sectionTimes[5] || 0),
        section_6_score: Number(state.sectionScores[5] || 0),

        total_time: Number(totalTime || 0),
        total_score: Number(state.totalScore || 0)
    };

    console.log("[SUPABASE] 保存開始:", result);

    try {

        const { data, error } = await supabaseClient
            .from("game_results")
            .insert(result)
            .select();

        if (error) {
            console.error("[SUPABASE] 保存失敗:", error);
            return;
        }

        console.log("[SUPABASE] 保存成功:", data);

    }
    catch (error) {
        console.error("[SUPABASE] 通信エラー:", error);
    }
}


function resetHUD() {
    DOM.score.textContent = "0";
    DOM.miss.textContent = "0";
    DOM.combo.textContent = "0";
    DOM.comboSideValue.textContent = "0";
    DOM.accuracy.textContent = "100.0%";
}


function updateHUD() {

    DOM.score.textContent = String(state.score);
    DOM.miss.textContent = String(state.miss);
    DOM.combo.textContent = String(state.combo);
    DOM.comboSideValue.textContent = String(state.combo);

    const attempts = state.sectionCharsTyped + state.miss;
    const accuracy = attempts > 0 ? (state.sectionCharsTyped / attempts) * 100 : 100;

    DOM.accuracy.textContent = `${accuracy.toFixed(1)}%`;
}


function resetProgress() {
    DOM.progressCurrent.textContent = "0";
    DOM.progressTotal.textContent = String(state.sectionTotalChars);
    DOM.progressPercent.textContent = "0%";
    DOM.progressFill.style.width = "0%";
}


function updateProgress() {

    const total = state.sectionTotalChars;
    const current = state.sectionCharsTyped;

    const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;

    DOM.progressCurrent.textContent = String(current);
    DOM.progressTotal.textContent = String(total);
    DOM.progressPercent.textContent = `${percent.toFixed(0)}%`;

    DOM.progressFill.style.width = `${percent}%`;

    const runnerPercent = Math.min(92, 2 + (percent * 0.9));

    DOM.runner.style.left = `${runnerPercent}%`;
}


function updateSectionNumber() {
    DOM.sectionNumber.textContent = String(state.currentSection + 1);
}


function resetRunner() {
    DOM.runner.style.left = "2%";
}


function updateRequiredKey() {

    clearCurrentKeys();

    if (!state.currentAnswer || state.currentPosition >= state.currentAnswer.length) {
        DOM.nextKey.textContent = "✓";
        DOM.nextKeyCombo.textContent = "COMPLETE";
        return;
    }

    const required = state.currentAnswer[state.currentPosition];

    DOM.nextKey.textContent = required;
    DOM.nextKeyCombo.textContent = getKeyGuide(required);

    DOM.keys.forEach(key => {
        if (String(key.dataset.key || "").toLowerCase() === required) {
            key.classList.add("current");
        }
    });
}


function getKeyGuide(character) {

    const map = {
        " ": "SPACE",
        "!": "Shift + 1",
        '"': "Shift + 2",
        "#": "Shift + 3",
        "$": "Shift + 4",
        "%": "Shift + 5",
        "&": "Shift + 6",
        "'": "Shift + 7",
        "(": "Shift + 8",
        ")": "Shift + 9",
        "=": "Shift + -",
        "~": "Shift + ^",
        "|": "Shift + \\",
        "`": "Shift + @",
        "{": "Shift + [",
        "}": "Shift + ]",
        "+": "Shift + ;",
        "*": "Shift + :",
        "<": "Shift + ,",
        ">": "Shift + .",
        "?": "Shift + /",
        "_": "Shift + \\"
    };

    if (character === " ") {
        return "SPACE";
    }

    if (Object.prototype.hasOwnProperty.call(map, character)) {
        return map[character];
    }

    if (/^[a-z]$/i.test(character)) {
        return character.toUpperCase();
    }

    if (/^[0-9]$/.test(character)) {
        return character;
    }

    return character;
}


function flashPressedKey(keyValue) {

    let target = null;

    DOM.keys.forEach(key => {
        const datasetKey = String(key.dataset.key || "").toLowerCase();
        if (datasetKey === keyValue) {
            target = key;
        }
    });

    if (!target) {
        return;
    }

    target.classList.add("pressed");

    setTimeout(() => {
        target.classList.remove("pressed");
    }, 100);
}


function clearCurrentKeys() {
    DOM.keys.forEach(key => {
        key.classList.remove("current");
    });
}


function clearPressedKeys() {
    DOM.keys.forEach(key => {
        key.classList.remove("pressed");
    });
}


function flashEffect(element) {

    if (!element) {
        return;
    }

    element.classList.remove("show");

    void element.offsetWidth;

    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 600);
}


function clearInput() {
    if (DOM.typingInput) {
        DOM.typingInput.value = "";
    }
}


function focusInput() {

    if (state.finalFinished) {
        return;
    }

    if (!DOM.typingInput) {
        return;
    }

    try {
        DOM.typingInput.focus({ preventScroll: true });
    }
    catch {
        DOM.typingInput.focus();
    }
}


function hideAllOverlays() {
    DOM.titleOverlay.classList.add("hidden");
    DOM.countdownOverlay.classList.add("hidden");
    DOM.errorOverlay.classList.add("hidden");
    DOM.resultOverlay.classList.add("hidden");
    DOM.finalOverlay.classList.add("hidden");
}


function showError(message) {

    console.error("[KIR ERROR]", message);

    const errorMessage = document.getElementById("error-message");
    const errorOverlay = document.getElementById("error-overlay");

    if (errorMessage) {
        errorMessage.textContent = String(message);
    }

    if (errorOverlay) {
        errorOverlay.classList.remove("hidden");
    }
}


function formatTime(milliseconds) {

    const safe = Math.max(0, Number(milliseconds) || 0);

    const minutes = Math.floor(safe / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    const millis = Math.floor(safe % 1000);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(millis).padStart(3, "0")
    );
}


function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


window.KIR_GAME = {

    getState() {
        return state;
    },

    restart() {
        location.reload();
    },

    start() {
        if (state.titleScreen && state.dataReady) {
            startCountdown();
        }
    },

    finishSection() {
        finishSection();
    }

};
