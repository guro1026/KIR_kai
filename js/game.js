/* =========================================================
   KIR RECREATION TOURNAMENT 2026
   めちゃむずキーボード早打ち駅伝

   完全版 game.js

   CSV仕様
   ---------------------------------------------------------
   question_no,section,title,display,answer

   display
   → 画面に表示するお題

   answer
   → プレイヤーが入力するローマ字
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

/*
 * 問題クリア後、次の問題へ移るまで
 */
const NEXT_QUESTION_DELAY = 200;

/*
 * セクション切り替え時の待機
 */
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

    /* -------------------------
       Team
    ------------------------- */

    team: "A",

    /* -------------------------
       CSV
    ------------------------- */

    sectionsData: [],

    /* -------------------------
       Section
    ------------------------- */

    currentSection: 0,

    sectionQuestions: [],

    currentQuestionIndex: 0,

    /* -------------------------
       Current Question
    ------------------------- */

    currentAnswer: "",

    currentPosition: 0,

    /* -------------------------
       Current Section Score
    ------------------------- */

    score: 0,

    miss: 0,

    combo: 0,

    /* -------------------------
       Total Race Score
    ------------------------- */

    totalScore: 0,

    totalMiss: 0,

    /* -------------------------
       Progress
    ------------------------- */

    sectionTotalChars: 0,

    sectionCharsTyped: 0,

    /* -------------------------
       Timer
    ------------------------- */

    sectionStartTime: 0,

    sectionTimes: [],

    timerInterval: null,

    /* -------------------------
       Game Status
    ------------------------- */

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

    if (state.initialized) {
        return;
    }

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

        showError(
            error.message ||
            "ゲームを初期化できませんでした。"
        );
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

        throw new Error(
            "HTMLに必要な要素がありません: " +
            missing.join(", ")
        );
    }
}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    document.addEventListener(
        "keydown",
        handleKeyDown
    );


    /* -------------------------
       Team Buttons
    ------------------------- */

    DOM.teamButtons.forEach(button => {

        button.addEventListener("click", () => {

            const team =
                String(button.dataset.team || "")
                    .toUpperCase();

            if (!VALID_TEAMS.includes(team)) {
                return;
            }

            if (
                state.gameStarted ||
                state.countdownRunning
            ) {
                return;
            }

            state.team = team;

            applyTeam();

            updateTeamButtons();

            updateURLTeam(team);
        });
    });


    /* -------------------------
       Result
    ------------------------- */

    DOM.resultNextButton.addEventListener(
        "click",
        handleResultNext
    );


    /* -------------------------
       Restart
    ------------------------- */

    DOM.restartButton.addEventListener(
        "click",
        () => {
            location.reload();
        }
    );


    /* -------------------------
       Error Reload
    ------------------------- */

    DOM.errorReloadButton.addEventListener(
        "click",
        () => {
            location.reload();
        }
    );


    /* -------------------------
       Blur
    ------------------------- */

    window.addEventListener(
        "blur",
        clearPressedKeys
    );


    /* -------------------------
       Hidden Input
       クリックされた場合も
       キーボード入力を受けられるようにする
    ------------------------- */

    DOM.typingInput.addEventListener(
        "blur",
        () => {
            if (
                state.gameStarted &&
                !state.sectionFinished
            ) {
                setTimeout(
                    focusTypingInput,
                    0
                );
            }
        }
    );


    DOM.typingInput.addEventListener(
        "input",
        handleInput
    );
}


/* =========================================================
   KEYBOARD INPUT
========================================================= */

function handleKeyDown(event) {

    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {
        return;
    }


    /* -------------------------
       Enter
    ------------------------- */

    if (event.key === "Enter") {

        event.preventDefault();

        if (state.finalFinished) {

            location.reload();

            return;
        }


        if (
            !state.gameStarted &&
            !state.countdownRunning &&
            !state.sectionFinished
        ) {

            startCountdown();

            return;
        }


        if (state.sectionFinished) {

            handleResultNext();

            return;
        }

        return;
    }


    /* -------------------------
       Game Start前
    ------------------------- */

    if (
        !state.gameStarted ||
        state.sectionFinished ||
        state.processingAnswer ||
        state.countdownRunning
    ) {
        return;
    }


    /*
     * 日本語IME等による入力を避けるため、
     * ここでは1文字キーだけ処理する。
     */
    if (
        typeof event.key !== "string" ||
        event.key.length !== 1
    ) {
        return;
    }


    /*
     * typing-input にフォーカスしている場合、
     * inputイベント側でも処理されるため、
     * ここでは直接判定する。
     */
    flashPressedKey(
        normalizeInputCharacter(event.key)
    );

    checkCharacter(
        normalizeInputCharacter(event.key)
    );
}


/* =========================================================
   INPUT EVENT
========================================================= */

/*
 * hidden / visible input をHTML側に置いている場合にも
 * 動作するようにしてある。
 *
 * ただし二重入力を防ぐため、
 * keydownで処理した場合は基本的に
 * input側の文字をクリアする。
 */

function handleInput(event) {

    if (
        !state.gameStarted ||
        state.sectionFinished ||
        state.processingAnswer
    ) {
        event.target.value = "";
        return;
    }

    const value = event.target.value;

    if (!value) {
        return;
    }

    /*
     * 入力された文字を1文字ずつ処理
     */
    for (const char of value) {

        const normalized =
            normalizeInputCharacter(char);

        if (normalized) {

            flashPressedKey(normalized);

            checkCharacter(normalized);
        }
    }

    event.target.value = "";
}


/* =========================================================
   INPUT NORMALIZE
========================================================= */

function normalizeInputCharacter(char) {

    if (
        typeof char !== "string" ||
        char.length === 0
    ) {
        return "";
    }

    /*
     * 英字は小文字に統一。
     * CSV answerも小文字前提。
     */
    return char.toLowerCase();
}


/* =========================================================
   TEAM
========================================================= */

function readTeamFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const urlTeam =
        String(
            params.get("team") || ""
        ).toUpperCase();

    if (
        VALID_TEAMS.includes(urlTeam)
    ) {

        state.team = urlTeam;

    } else {

        state.team = "A";
    }
}


function updateURLTeam(team) {

    const url =
        new URL(
            window.location.href
        );

    url.searchParams.set(
        "team",
        team
    );

    window.history.replaceState(
        {},
        "",
        url
    );
}


function applyTeam() {

    const team = state.team;

    DOM.teamName.textContent =
        `TEAM ${team}`;

    DOM.runnerImage.src =
        `img/character/${team}team.png`;

    DOM.runnerImage.alt =
        `Team ${team}`;

    updateTeamButtons();
}


function updateTeamButtons() {

    DOM.teamButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.team === state.team
        );
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

    DOM.timer.textContent =
        "00:00.000";

    DOM.questionNumber.textContent =
        "1 / 1";

    DOM.questionText.textContent =
        "LOADING...";

    DOM.romajiProgress.textContent =
        "";

    if (DOM.typingInput) {
        DOM.typingInput.value = "";
    }

    updateHUD();

    updateProgress();

    resetRunner();

    hideAllOverlays();

    document.body.classList.add("ready");
}


/* =========================================================
   CSV LOAD
========================================================= */

async function loadAllSections() {

    DOM.questionText.textContent =
        "LOADING...";

    const loadedSections = [];


    try {

        for (
            let index = 0;
            index < SECTION_FILES.length;
            index++
        ) {

            const file =
                SECTION_FILES[index];

            const response =
                await fetch(
                    `${file}?v=${Date.now()}`
                );

            if (!response.ok) {

                throw new Error(
                    `CSVを読み込めませんでした: ${file} ` +
                    `(${response.status})`
                );
            }

            const text =
                await response.text();

            const questions =
                parseCSV(text);

            if (
                !Array.isArray(questions) ||
                questions.length === 0
            ) {

                throw new Error(
                    `CSVに問題がありません: ${file}`
                );
            }

            loadedSections.push(
                questions
            );
        }


        state.sectionsData =
            loadedSections;


        /*
         * 最初のセクションを準備
         */
        prepareSection(0);


    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "CSVの読み込みに失敗しました。"
        );
    }
}


/* =========================================================
   CSV PARSER
========================================================= */

function parseCSV(text) {

    /*
     * BOM除去
     */
    text =
        String(text || "")
            .replace(/^\uFEFF/, "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");


    const rows = [];

    let row = [];

    let field = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char = text[i];

        const next = text[i + 1];


        /* -------------------------
           Quote
        ------------------------- */

        if (char === '"') {

            if (
                insideQuotes &&
                next === '"'
            ) {

                field += '"';

                i++;

            } else {

                insideQuotes =
                    !insideQuotes;
            }

            continue;
        }


        /* -------------------------
           Comma
        ------------------------- */

        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(field);

            field = "";

            continue;
        }


        /* -------------------------
           New Line
        ------------------------- */

        if (
            char === "\n" &&
            !insideQuotes
        ) {

            row.push(field);

            rows.push(row);

            row = [];

            field = "";

            continue;
        }


        field += char;
    }


    /*
     * 最後の行
     */
    if (
        field !== "" ||
        row.length > 0
    ) {

        row.push(field);

        rows.push(row);
    }


    if (rows.length < 2) {
        return [];
    }


    const headers =
        rows[0].map(
            header =>
                String(header)
                    .trim()
                    .toLowerCase()
        );


    const result = [];


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const values = rows[i];


        /*
         * 空行は無視
         */
        if (
            values.every(
                value =>
                    String(value).trim() === ""
            )
        ) {
            continue;
        }


        const item = {};


        headers.forEach(
            (header, index) => {

                item[header] =
                    values[index] !== undefined
                        ? values[index].trim()
                        : "";
            }
        );


        /*
         * answer必須
         */
        if (
            !item.answer
        ) {

            console.warn(
                "answerが空の問題をスキップ:",
                item
            );

            return;
        }


        /*
         * displayが空の場合はtitleを使用
         */
        if (
            !item.display
        ) {

            item.display =
                item.title ||
                "";
        }


        result.push(item);
    }


    return result;
}


/* =========================================================
   SECTION PREPARE
========================================================= */

function prepareSection(sectionIndex) {

    if (
        sectionIndex < 0 ||
        sectionIndex >= state.sectionsData.length
    ) {

        showError(
            "存在しないセクションです。"
        );

        return;
    }


    stopTimer();


    state.currentSection =
        sectionIndex;

    state.sectionQuestions =
        state.sectionsData[
            sectionIndex
        ];


    state.currentQuestionIndex = 0;


    state.score = 0;

    state.miss = 0;

    state.combo = 0;


    state.sectionCharsTyped = 0;


    state.sectionTotalChars =
        state.sectionQuestions.reduce(
            (total, question) => {

                return (
                    total +
                    String(
                        question.answer || ""
                    ).length
                );
            },
            0
        );


    state.currentAnswer = "";

    state.currentPosition = 0;


    state.gameStarted = false;

    state.sectionFinished = false;

    state.processingAnswer = false;

    state.countdownRunning = false;


    DOM.sectionNumber.textContent =
        String(sectionIndex + 1);


    DOM.questionNumber.textContent =
        `1 / ${state.sectionQuestions.length}`;


    DOM.progressTotal.textContent =
        String(state.sectionTotalChars);


    DOM.questionText.textContent =
        "";


    DOM.romajiProgress.textContent =
        "";


    DOM.timer.textContent =
        "00:00.000";


    resetRunner();

    updateHUD();

    updateProgress();

    hideAllOverlays();

    document.body.classList.add("ready");


    /*
     * 問題を表示
     */
    showQuestion();


    /*
     * 入力欄をクリア
     */
    if (DOM.typingInput) {
        DOM.typingInput.value = "";
    }


    /*
     * 少し待ってからフォーカス
     */
    setTimeout(
        focusTypingInput,
        50
    );
}


/* =========================================================
   SHOW QUESTION
========================================================= */

function showQuestion() {

    const question =
        state.sectionQuestions[
            state.currentQuestionIndex
        ];


    if (!question) {

        finishSection();

        return;
    }


    /*
     * ======================================================
     * 重要
     *
     * display
     * → 画面に表示
     *
     * answer
     * → 実際の入力判定
     * ======================================================
     */

    DOM.questionText.textContent =
        question.display || "";


    state.currentAnswer =
        String(
            question.answer || ""
        ).toLowerCase();


    state.currentPosition = 0;


    DOM.questionNumber.textContent =
        `${state.currentQuestionIndex + 1} / ` +
        `${state.sectionQuestions.length}`;


    updateRomajiProgress();

    updateRequiredKey();

    focusTypingInput();
}


/* =========================================================
   ROMAJI PROGRESS
========================================================= */

function updateRomajiProgress() {

    const answer =
        state.currentAnswer;

    const position =
        state.currentPosition;


    /*
     * -----------------------------------------------
     * answerが空の場合
     * -----------------------------------------------
     */

    if (!answer) {

        DOM.romajiProgress.textContent = "";

        return;
    }


    /*
     * -----------------------------------------------
     * 入力済み
     * -----------------------------------------------
     */

    const typed =
        answer.slice(
            0,
            position
        );


    /*
     * -----------------------------------------------
     * 現在入力する1文字
     * -----------------------------------------------
     */

    const current =
        answer.charAt(position);


    /*
     * -----------------------------------------------
     * これから入力する文字
     * -----------------------------------------------
     */

    const remaining =
        answer.slice(
            position + 1
        );


    /*
     * -----------------------------------------------
     * HTMLとして組み立てる
     *
     * textContentを使わず、
     * 各部分をspanで分離する。
     * -----------------------------------------------
     */

    DOM.romajiProgress.innerHTML = "";


    /*
     * 入力済み
     */

    if (typed) {

        const typedSpan =
            document.createElement("span");

        typedSpan.className =
            "typed";

        typedSpan.textContent =
            typed;

        DOM.romajiProgress.appendChild(
            typedSpan
        );
    }


    /*
     * 現在入力する文字
     */

    if (current) {

        const currentSpan =
            document.createElement("span");

        currentSpan.className =
            "current";

        currentSpan.textContent =
            current;

        DOM.romajiProgress.appendChild(
            currentSpan
        );
    }


    /*
     * 未入力
     */

    if (remaining) {

        const remainingSpan =
            document.createElement("span");

        remainingSpan.className =
            "remaining";

        remainingSpan.textContent =
            remaining;

        DOM.romajiProgress.appendChild(
            remainingSpan
        );
    }
}

/* =========================================================
   CHARACTER CHECK
========================================================= */

function checkCharacter(char) {

    if (
        !state.gameStarted ||
        state.sectionFinished ||
        state.processingAnswer
    ) {
        return;
    }


    const input =
        normalizeInputCharacter(char);


    if (!input) {
        return;
    }


    const expected =
        state.currentAnswer[
            state.currentPosition
        ];


    /*
     * ======================================================
     * 正解
     * ======================================================
     */

    if (input === expected) {

        state.currentPosition++;

        state.sectionCharsTyped++;

        state.combo++;


        /*
         * 1文字 = 1点
         */
        state.score++;


        showGoodEffect();


        /*
         * コンボが一定数に到達したらBOOST
         */
        if (
            state.combo > 0 &&
            state.combo % 10 === 0
        ) {

            showBoostEffect();
        }


        updateHUD();

        updateProgress();

        updateRomajiProgress();

        updateRequiredKey();


        /*
         * 問題クリア
         */
        if (
            state.currentPosition >=
            state.currentAnswer.length
        ) {

            completeQuestion();

        }

        return;
    }


    /*
     * ======================================================
     * ミス
     * ======================================================
     */

    state.miss++;

    state.combo = 0;

    showMissEffect();

    updateHUD();
}


/* =========================================================
   QUESTION COMPLETE
========================================================= */

async function completeQuestion() {

    if (
        state.processingAnswer
    ) {
        return;
    }


    state.processingAnswer = true;


    /*
     * 最終問題かどうか
     */
    const isLastQuestion =
        state.currentQuestionIndex >=
        state.sectionQuestions.length - 1;


    updateProgress();


    /*
     * ゴール表示
     */
    if (isLastQuestion) {

        updateRunner(1);

        if (DOM.finishFlag) {
            DOM.finishFlag.classList.add("active");
        }

    } else {

        /*
         * 問題単位の進行率
         */
        const questionProgress =
            (
                state.currentQuestionIndex + 1
            ) /
            state.sectionQuestions.length;

        updateRunner(questionProgress);
    }


    await sleep(
        NEXT_QUESTION_DELAY
    );


    /*
     * 最終問題ならセクション終了
     */
    if (isLastQuestion) {

        state.processingAnswer = false;

        finishSection();

        return;
    }


    /*
     * 次の問題
     */
    state.currentQuestionIndex++;

    state.processingAnswer = false;

    showQuestion();

    focusTypingInput();
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    DOM.score.textContent =
        String(state.score);


    DOM.miss.textContent =
        String(state.miss);


    DOM.combo.textContent =
        String(state.combo);


    if (DOM.comboSideValue) {

        DOM.comboSideValue.textContent =
            String(state.combo);
    }


    const totalAttempts =
        state.sectionCharsTyped +
        state.miss;


    let accuracy = 100;


    if (totalAttempts > 0) {

        accuracy =
            (
                state.sectionCharsTyped /
                totalAttempts
            ) * 100;
    }


    DOM.accuracy.textContent =
        `${accuracy.toFixed(1)}%`;
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const total =
        state.sectionTotalChars;


    const current =
        state.sectionCharsTyped;


    let percent = 0;


    if (total > 0) {

        percent =
            (
                current /
                total
            ) * 100;
    }


    percent =
        Math.min(
            Math.max(percent, 0),
            100
        );


    DOM.progressPercent.textContent =
        `${percent.toFixed(0)}%`;


    DOM.progressCurrent.textContent =
        String(current);


    DOM.progressTotal.textContent =
        String(total);


    if (DOM.progressFill) {

        DOM.progressFill.style.width =
            `${percent}%`;
    }


    updateRunner(
        percent / 100
    );
}


/* =========================================================
   RUNNER
========================================================= */

function resetRunner() {

    DOM.runner.style.left =
        "0%";

    DOM.runner.style.transform =
        "translateX(0)";

    if (DOM.finishFlag) {

        DOM.finishFlag.classList.remove(
            "active"
        );
    }
}


function updateRunner(percent) {

    const runnerPercent =
        Math.min(
            Math.max(
                percent * 92,
                0
            ),
            92
        );


    DOM.runner.style.left =
        `${runnerPercent}%`;
}


/* =========================================================
   COUNTDOWN
========================================================= */

async function startCountdown() {

    if (
        state.countdownRunning ||
        state.gameStarted ||
        state.sectionFinished
    ) {
        return;
    }


    /*
     * CSV読み込み前なら開始しない
     */
    if (
        !state.sectionQuestions ||
        state.sectionQuestions.length === 0
    ) {

        showError(
            "問題データが読み込まれていません。"
        );

        return;
    }


    state.countdownRunning = true;


    DOM.countdownOverlay.classList.remove(
        "hidden"
    );


    const sequence = [
        "3",
        "2",
        "1",
        "GO!"
    ];


    for (
        let i = 0;
        i < sequence.length;
        i++
    ) {

        DOM.countdown.textContent =
            sequence[i];


        DOM.countdown.style.animation =
            "none";


        void DOM.countdown.offsetWidth;


        DOM.countdown.style.animation =
            "countdown-pop 0.9s ease-out";


        await sleep(
            COUNTDOWN_STEP
        );
    }


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    state.countdownRunning = false;

    state.gameStarted = true;

    state.sectionFinished = false;


    document.body.classList.remove(
        "ready"
    );


    /*
     * タイマー開始
     *
     * sectionStartTime は
     * startTimer() の中だけで設定する。
     */
    startTimer();

    focusTypingInput();
}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();


    state.sectionStartTime =
        performance.now();


    updateTimer();


    state.timerInterval =
        window.setInterval(
            updateTimer,
            10
        );
}


function updateTimer() {

    if (!state.gameStarted) {
        return;
    }


    const elapsed =
        performance.now() -
        state.sectionStartTime;


    DOM.timer.textContent =
        formatTime(elapsed);
}


function stopTimer() {

    if (
        state.timerInterval !== null
    ) {

        window.clearInterval(
            state.timerInterval
        );

        state.timerInterval = null;
    }
}


function formatTime(milliseconds) {

    const ms =
        Math.max(
            0,
            Math.floor(milliseconds)
        );


    const minutes =
        Math.floor(
            ms / 60000
        );


    const seconds =
        Math.floor(
            (ms % 60000) / 1000
        );


    const millis =
        ms % 1000;


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

    if (!DOM.goodEffect) {
        return;
    }


    DOM.goodEffect.classList.remove(
        "hidden"
    );


    DOM.goodEffect.style.animation =
        "none";


    void DOM.goodEffect.offsetWidth;


    DOM.goodEffect.style.animation =
        "good-pop 0.3s ease-out";


    setTimeout(
        () => {
            DOM.goodEffect.classList.add(
                "hidden"
            );
        },
        300
    );
}


function showMissEffect() {

    if (!DOM.missEffect) {
        return;
    }


    DOM.missEffect.classList.remove(
        "hidden"
    );


    DOM.missEffect.style.animation =
        "none";


    void DOM.missEffect.offsetWidth;


    DOM.missEffect.style.animation =
        "miss-pop 0.3s ease-out";


    setTimeout(
        () => {
            DOM.missEffect.classList.add(
                "hidden"
            );
        },
        300
    );
}


function showBoostEffect() {

    if (!DOM.boostEffect) {
        return;
    }


    DOM.boostEffect.classList.remove(
        "hidden"
    );


    DOM.boostEffect.style.animation =
        "none";


    void DOM.boostEffect.offsetWidth;


    DOM.boostEffect.style.animation =
        "boost-pop 0.5s ease-out";


    setTimeout(
        () => {
            DOM.boostEffect.classList.add(
                "hidden"
            );
        },
        500
    );
}


/* =========================================================
   KEYBOARD HIGHLIGHT
========================================================= */

function updateRequiredKey() {

    const nextChar =
        state.currentAnswer[
            state.currentPosition
        ] || "";


    DOM.keys.forEach(key => {

        key.classList.remove(
            "active"
        );


        if (
            key.dataset.key ===
            nextChar
        ) {

            key.classList.add(
                "active"
            );
        }
    });
}


/*
 * 互換用
 */
function updateKeyboardHighlight() {

    updateRequiredKey();
}


function flashPressedKey(char) {

    if (!char) {
        return;
    }


    DOM.keys.forEach(key => {

        if (
            key.dataset.key === char
        ) {

            key.classList.add(
                "pressed"
            );


            setTimeout(
                () => {
                    key.classList.remove(
                        "pressed"
                    );
                },
                150
            );
        }
    });
}


function clearPressedKeys() {

    DOM.keys.forEach(key => {

        key.classList.remove(
            "pressed"
        );
    });
}


/* =========================================================
   FOCUS
========================================================= */

function focusTypingInput() {

    if (!DOM.typingInput) {
        return;
    }


    /*
     * typing-input が表示されている場合でも
     * ゲーム画面の邪魔をしないようにする。
     *
     * CSS側でopacity:0等にしている前提。
     */
    try {

        DOM.typingInput.focus({
            preventScroll: true
        });

    } catch {

        DOM.typingInput.focus();
    }
}


/* =========================================================
   SECTION FINISH
========================================================= */

function finishSection() {

    if (
        state.sectionFinished
    ) {
        return;
    }


    stopTimer();


    state.sectionFinished = true;

    state.gameStarted = false;


    const elapsed =
        performance.now() -
        state.sectionStartTime;


    const finalTime =
        formatTime(elapsed);


    state.sectionTimes[
        state.currentSection
    ] = elapsed;


    DOM.timer.textContent =
        finalTime;


    DOM.resultTime.textContent =
        finalTime;


    DOM.resultScore.textContent =
        String(state.score);


    DOM.resultMiss.textContent =
        String(state.miss);


    DOM.resultOverlay.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "ready"
    );
}


/* =========================================================
   RESULT NEXT
========================================================= */

function handleResultNext() {

    if (
        !state.sectionFinished
    ) {
        return;
    }


    DOM.resultOverlay.classList.add(
        "hidden"
    );


    /*
     * 現在セクションの結果を
     * 総合結果へ加算
     */
    state.totalScore +=
        state.score;


    state.totalMiss +=
        state.miss;


    const nextSection =
        state.currentSection + 1;


    /*
     * 全セクション終了
     */
    if (
        nextSection >=
        state.sectionsData.length
    ) {

        finishRace();

        return;
    }


    /*
     * 次セクション
     */
    setTimeout(
        () => {
            prepareSection(
                nextSection
            );
        },
        NEXT_SECTION_DELAY
    );
}


/* =========================================================
   FINAL RESULT
========================================================= */

function finishRace() {

    stopTimer();


    state.gameStarted = false;

    state.sectionFinished = true;

    state.finalFinished = true;


    /*
     * 最後のセクションのタイム
     */
    const finalSectionTime =
        state.sectionTimes[
            state.sectionTimes.length - 1
        ] || 0;


    /*
     * 総合タイム
     *
     * 各区間タイムの合計
     */
    const totalTime =
        state.sectionTimes.reduce(
            (total, time) => {
                return total + time;
            },
            0
        );


    DOM.finalTime.textContent =
        formatTime(totalTime);


    DOM.finalScore.textContent =
        String(state.totalScore);


    DOM.finalMiss.textContent =
        String(state.totalMiss);


    DOM.timer.textContent =
        formatTime(totalTime);


    if (DOM.finishFlag) {

        DOM.finishFlag.classList.add(
            "active"
        );
    }


    DOM.finalOverlay.classList.remove(
        "hidden"
    );
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    console.error(
        "[KIR ERROR]",
        message
    );


    if (DOM.errorMessage) {

        DOM.errorMessage.textContent =
            message;
    }


    if (DOM.errorOverlay) {

        DOM.errorOverlay.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   OVERLAY CONTROL
========================================================= */

function hideAllOverlays() {

    if (DOM.countdownOverlay) {

        DOM.countdownOverlay.classList.add(
            "hidden"
        );
    }


    if (DOM.errorOverlay) {

        DOM.errorOverlay.classList.add(
            "hidden"
        );
    }


    if (DOM.resultOverlay) {

        DOM.resultOverlay.classList.add(
            "hidden"
        );
    }


    if (DOM.finalOverlay) {

        DOM.finalOverlay.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   UTIL
========================================================= */

function sleep(ms) {

    return new Promise(
        resolve => {
            setTimeout(
                resolve,
                ms
            );
        }
    );
}


/* =========================================================
   DEBUG
   ブラウザのConsoleから確認できる。
========================================================= */

window.KIR_GAME = {

    getState() {
        return {
            ...state
        };
    },

    getSections() {
        return state.sectionsData;
    },

    reload() {
        location.reload();
    }
};


/* =========================================================
   END
========================================================= */