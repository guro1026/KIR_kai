/* =========================================================
   KIR RECREATION TOURNAMENT 2026
   めちゃむずキーボード早打ち駅伝

   GAME LOGIC
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const TOTAL_SECTIONS = 6;

const VALID_TEAMS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
];

const COUNTDOWN_TIME = 1000;
const NEXT_QUESTION_DELAY = 200;


/* =========================================================
   STATE
========================================================= */

let sectionsData = [];

let currentSection = 1;
let sectionQuestions = [];

let currentQuestionIndex = 0;
let currentQuestion = null;

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

let countdownRunning = false;


/* =========================================================
   DOM
========================================================= */

const $ = (id) => document.getElementById(id);

const sectionNumber = $("section-number");
const questionNumber = $("question-number");
const questionText = $("question-text");

const typingInput = $("typing-input");

const timer = $("timer");
const teamName = $("team-name");

const runner = $("runner");
const runnerImage = $("runner-image");

const romajiProgress = $("romaji-progress");

const scoreElement = $("score");
const missElement = $("miss");
const comboElement = $("combo");
const accuracyElement = $("accuracy");

const comboSide = $("combo-side");

const progressCurrent = $("progress-current");
const progressTotal = $("progress-total");
const progressFill = $("progress-fill");
const progressPercent = $("progress-percent");

const gameState = $("game-state");

const goodEffect = $("good-effect");
const missEffect = $("miss-effect");
const boostEffect = $("boost-effect");

const countdownOverlay = $("countdown-overlay");
const countdownElement = $("countdown");

const errorOverlay = $("error-overlay");
const errorMessage = $("error-message");
const errorReloadButton = $("error-reload-button");

const resultOverlay = $("result-overlay");
const resultTime = $("result-time");
const resultScore = $("result-score");
const resultMiss = $("result-miss");

const finalOverlay = $("final-overlay");
const finalTime = $("final-time");
const finalScore = $("final-score");
const finalMiss = $("final-miss");

const restartButton = $("restart-button");

const teamButtons = document.querySelectorAll(
    ".team-select"
);

const keyboardKeys = document.querySelectorAll(
    ".key[data-key]"
);


/* =========================================================
   TEAM
========================================================= */

function getTeamFromURL() {

    const params = new URLSearchParams(
        window.location.search
    );

    const team = String(
        params.get("team") || "A"
    ).toUpperCase();

    if (!VALID_TEAMS.includes(team)) {
        return "A";
    }

    return team;
}

const TEAM = getTeamFromURL();


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    try {

        checkDOM();

        applyTeam();

        setupEvents();

        resetAllState();

        await loadAllSections();

        prepareSection();

    } catch (error) {

        showError(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}


/* =========================================================
   DOM CHECK
========================================================= */

function checkDOM() {

    const required = {
        sectionNumber,
        questionNumber,
        questionText,
        typingInput,
        timer,
        teamName,
        runner,
        runnerImage,
        romajiProgress,
        scoreElement,
        missElement,
        comboElement,
        accuracyElement,
        progressCurrent,
        progressTotal,
        progressFill,
        progressPercent,
        gameState,
        countdownOverlay,
        countdownElement,
        errorOverlay,
        errorMessage,
        errorReloadButton,
        resultOverlay,
        resultTime,
        resultScore,
        resultMiss,
        finalOverlay,
        finalTime,
        finalScore,
        finalMiss,
        restartButton
    };

    for (const [name, element] of Object.entries(required)) {

        if (!element) {

            throw new Error(
                `HTMLに必要な要素がありません: ${name}`
            );
        }
    }
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    document.addEventListener(
        "keydown",
        handleKeyDown
    );


    errorReloadButton.addEventListener(
        "click",
        () => {
            window.location.reload();
        }
    );


    restartButton.addEventListener(
        "click",
        restartGame
    );


    teamButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const selectedTeam =
                        button.dataset.team;

                    if (
                        !VALID_TEAMS.includes(
                            selectedTeam
                        )
                    ) {
                        return;
                    }

                    const url =
                        new URL(
                            window.location.href
                        );

                    url.searchParams.set(
                        "team",
                        selectedTeam
                    );

                    window.location.href =
                        url.toString();
                }
            );
        }
    );
}


/* =========================================================
   RESET
========================================================= */

function resetAllState() {

    stopTimer();

    currentSection = 1;

    sectionQuestions = [];

    currentQuestionIndex = 0;
    currentQuestion = null;

    currentAnswer = "";
    currentPosition = 0;

    score = 0;
    miss = 0;
    combo = 0;

    totalScore = 0;
    totalMiss = 0;

    sectionStartTime = 0;
    sectionTimes = [];

    sectionTotalChars = 0;
    sectionCharsTyped = 0;

    gameStarted = false;
    sectionFinished = false;
    processingAnswer = false;
    countdownRunning = false;

    timer.textContent = "00:00.000";

    updateScoreHUD();
    updateProgress();

    setGameState("READY");
}


/* =========================================================
   APPLY TEAM
========================================================= */

function applyTeam() {

    teamName.textContent =
        `TEAM ${TEAM}`;

    runnerImage.src =
        `img/character/${TEAM}team.png`;

    runnerImage.alt =
        `Team ${TEAM}`;

    runnerImage.onerror = () => {

        showError(
            `ランナー画像が見つかりません。\n\n` +
            `img/character/${TEAM}team.png`
        );
    };


    teamButtons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.team === TEAM
            );
        }
    );
}


/* =========================================================
   LOAD ALL CSV
========================================================= */

async function loadAllSections() {

    sectionsData = [];

    for (
        let section = 1;
        section <= TOTAL_SECTIONS;
        section++
    ) {

        const path =
            `data/section${section}.csv`;

        let response;

        try {

            response =
                await fetch(
                    `${path}?v=${Date.now()}`
                );

        } catch (error) {

            throw new Error(
                `CSVを読み込めませんでした。\n\n${path}`
            );
        }


        if (!response.ok) {

            throw new Error(
                `CSV読み込み失敗: ${path}\n` +
                `HTTP ${response.status}`
            );
        }


        const text =
            await response.text();

        const questions =
            parseCSV(text, section);

        if (!questions.length) {

            throw new Error(
                `SECTION ${section} に問題がありません。`
            );
        }

        sectionsData.push(
            questions
        );
    }
}


/* =========================================================
   ROBUST CSV PARSER
========================================================= */

function parseCSV(csvText, sectionNumberValue) {

    /*
        対応:
        - BOM
        - quoted field
        - quoted comma
        - escaped quote ""
        - quoted newline
        - 空欄
    */

    let text =
        String(csvText || "")
            .replace(/^\uFEFF/, "");


    const rows = [];

    let row = [];
    let field = "";

    let insideQuotes = false;


    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];


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


        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(field);
            field = "";

            continue;
        }


        if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {
                i++;
            }

            row.push(field);
            field = "";

            if (
                row.some(
                    value =>
                        String(value).length > 0
                )
            ) {
                rows.push(row);
            }

            row = [];

            continue;
        }


        field += char;
    }


    if (insideQuotes) {

        throw new Error(
            `SECTION ${sectionNumberValue} のCSVで` +
            `引用符が閉じられていません。`
        );
    }


    if (
        field.length > 0 ||
        row.length > 0
    ) {

        row.push(field);

        if (
            row.some(
                value =>
                    String(value).length > 0
            )
        ) {
            rows.push(row);
        }
    }


    if (rows.length < 2) {

        throw new Error(
            `SECTION ${sectionNumberValue} のCSVに` +
            `データがありません。`
        );
    }


    /* -----------------------------------------
       HEADER
    ----------------------------------------- */

    const headers =
        rows[0].map(
            header =>
                String(header)
                    .replace(/^\uFEFF/, "")
                    .trim()
        );


    const requiredHeaders = [
        "section",
        "title",
        "question_no",
        "display",
        "answer"
    ];


    for (
        const header of requiredHeaders
    ) {

        if (!headers.includes(header)) {

            throw new Error(
                `SECTION ${sectionNumberValue} のCSVに` +
                `必要な列 "${header}" がありません。`
            );
        }
    }


    const headerIndex = {};

    headers.forEach(
        (header, index) => {
            headerIndex[header] = index;
        }
    );


    /* -----------------------------------------
       DATA
    ----------------------------------------- */

    const questions = [];


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const rowData = rows[i];


        const section =
            String(
                rowData[
                    headerIndex.section
                ] ?? ""
            ).trim();


        const title =
            String(
                rowData[
                    headerIndex.title
                ] ?? ""
            ).trim();


        const questionNo =
            String(
                rowData[
                    headerIndex.question_no
                ] ?? ""
            ).trim();


        const display =
            String(
                rowData[
                    headerIndex.display
                ] ?? ""
            ).trim();


        /*
            IMPORTANT:

            answerはtrimしない。

            半角スペース、
            記号、
            カンマ、
            ピリオド等を
            完全に保持する。
        */

        const answer =
            String(
                rowData[
                    headerIndex.answer
                ] ?? ""
            );


        if (!section) {
            continue;
        }


        if (
            section !==
            String(sectionNumberValue)
        ) {

            throw new Error(
                `SECTION ${sectionNumberValue} ` +
                `CSVのsection値が不正です。\n` +
                `問題番号: ${i}`
            );
        }


        if (
            questionNo !==
            String(i)
        ) {

            throw new Error(
                `SECTION ${sectionNumberValue} の` +
                `question_noが不正です。\n\n` +
                `期待値: ${i}\n` +
                `実際: ${questionNo}`
            );
        }


        if (!answer) {

            throw new Error(
                `SECTION ${sectionNumberValue} ` +
                `QUESTION ${questionNo} のanswerが空です。`
            );
        }


        /*
            displayが空の場合は、
            とりあえずanswerを表示。

            SECTION 3〜5のdisplayを
            後からCSVで設定すれば、
            そちらが優先される。
        */

        const displayText =
            display || answer;


        questions.push({
            section,
            title,
            question_no: questionNo,
            display: displayText,
            answer
        });
    }


    return questions;
}


/* =========================================================
   PREPARE SECTION
========================================================= */

function prepareSection() {

    if (
        !sectionsData[currentSection - 1]
    ) {

        showError(
            `SECTION ${currentSection} のデータがありません。`
        );

        return;
    }


    sectionQuestions =
        sectionsData[
            currentSection - 1
        ];


    currentQuestionIndex = 0;
    currentQuestion = null;

    currentAnswer = "";
    currentPosition = 0;

    score = 0;
    miss = 0;
    combo = 0;

    sectionStartTime = 0;

    sectionTotalChars =
        sectionQuestions.reduce(
            (total, question) =>
                total +
                question.answer.length,
            0
        );


    sectionCharsTyped = 0;

    gameStarted = false;
    sectionFinished = false;
    processingAnswer = false;

    stopTimer();

    sectionNumber.textContent =
        currentSection;

    timer.textContent =
        "00:00.000";

    setGameState("READY");

    updateScoreHUD();
    updateProgress();

    resetRunner();

    showQuestion();

    hideOverlay(countdownOverlay);
    hideOverlay(resultOverlay);
    hideOverlay(finalOverlay);

    clearKeyboardHighlight();
}


/* =========================================================
   SHOW QUESTION
========================================================= */

function showQuestion() {

    if (
        currentQuestionIndex >=
        sectionQuestions.length
    ) {
        return;
    }


    currentQuestion =
        sectionQuestions[
            currentQuestionIndex
        ];


    /*
        display:
        → 人間が見る文字

        answer:
        → 実際に判定する文字
    */

    currentAnswer =
        currentQuestion.answer;

    currentPosition = 0;


    questionNumber.textContent =
        currentQuestion.question_no;


    questionText.textContent =
        currentQuestion.display;


    renderRomajiProgress();

    highlightNextKey();
}


/* =========================================================
   ROMAJI PROGRESS
========================================================= */

function renderRomajiProgress() {

    romajiProgress.innerHTML = "";


    const typed =
        currentAnswer.slice(
            0,
            currentPosition
        );


    const rest =
        currentAnswer.slice(
            currentPosition
        );


    if (typed) {

        const typedSpan =
            document.createElement("span");

        typedSpan.className =
            "romaji-typed";

        typedSpan.textContent =
            typed;

        romajiProgress.appendChild(
            typedSpan
        );
    }


    if (rest) {

        const restSpan =
            document.createElement("span");

        restSpan.className =
            "romaji-rest";

        restSpan.textContent =
            rest;

        romajiProgress.appendChild(
            restSpan
        );
    }
}


/* =========================================================
   COUNTDOWN
========================================================= */

async function startCountdown() {

    if (countdownRunning) {
        return;
    }

    if (gameStarted) {
        return;
    }

    if (sectionFinished) {
        return;
    }


    countdownRunning = true;

    showOverlay(countdownOverlay);

    setGameState("READY");


    const countValues = [
        "3",
        "2",
        "1",
        "GO!"
    ];


    for (
        const value of countValues
    ) {

        countdownElement.textContent =
            value;

        await sleep(
            COUNTDOWN_TIME
        );
    }


    hideOverlay(countdownOverlay);

    countdownRunning = false;

    startGame();
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (gameStarted) {
        return;
    }


    gameStarted = true;

    sectionFinished = false;

    sectionStartTime =
        performance.now();

    setGameState("PLAYING");

    startTimer();

    focusTypingInput();
}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();


    timerInterval =
        setInterval(
            updateTimer,
            10
        );
}


function stopTimer() {

    if (timerInterval !== null) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }
}


function updateTimer() {

    if (!gameStarted) {
        return;
    }


    if (!sectionStartTime) {
        return;
    }


    const elapsed =
        performance.now() -
        sectionStartTime;


    timer.textContent =
        formatTime(elapsed);
}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(milliseconds) {

    const totalMs =
        Math.max(
            0,
            Math.floor(milliseconds)
        );


    const minutes =
        Math.floor(
            totalMs / 60000
        );


    const seconds =
        Math.floor(
            (totalMs % 60000) / 1000
        );


    const ms =
        totalMs % 1000;


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(ms).padStart(3, "0")
    );
}


/* =========================================================
   KEYDOWN
========================================================= */

function handleKeyDown(event) {

    /* -----------------------------------------
       READY
    ----------------------------------------- */

    if (
        !gameStarted &&
        !sectionFinished &&
        !countdownRunning &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        startCountdown();

        return;
    }


    /* -----------------------------------------
       SECTION RESULT
    ----------------------------------------- */

    if (
        isOverlayVisible(resultOverlay) &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        if (
            currentSection <
            TOTAL_SECTIONS
        ) {

            currentSection++;

            prepareSection();

        } else {

            finishRace();
        }

        return;
    }


    /* -----------------------------------------
       FINAL
    ----------------------------------------- */

    if (
        isOverlayVisible(finalOverlay) &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        restartGame();

        return;
    }


    /* -----------------------------------------
       PLAYING ONLY
    ----------------------------------------- */

    if (!gameStarted) {
        return;
    }

    if (sectionFinished) {
        return;
    }

    if (processingAnswer) {
        return;
    }


    /*
        Ctrl / Alt / Meta etc. は
        タイピング文字として扱わない。
    */

    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {
        return;
    }


    /*
        1文字入力だけを判定。

        Spaceもevent.key.length === 1。
        記号も1文字。
    */

    if (event.key.length !== 1) {

        /*
            Shift単体などは
            ミスにしない。
        */

        return;
    }


    event.preventDefault();


    flashPressedKey(
        event.key
    );


    checkCharacter(
        event.key
    );
}


/* =========================================================
   CHARACTER JUDGEMENT
========================================================= */

function checkCharacter(inputChar) {

    if (
        currentPosition >=
        currentAnswer.length
    ) {
        return;
    }


    const expectedChar =
        currentAnswer[
            currentPosition
        ];


    /* -----------------------------------------
       CORRECT
    ----------------------------------------- */

    if (
        inputChar === expectedChar
    ) {

        currentPosition++;

        score++;

        combo++;

        sectionCharsTyped++;


        showGoodEffect();

        updateScoreHUD();

        updateProgress();

        renderRomajiProgress();

        highlightNextKey();


        /*
            コンボ演出
        */

        if (
            combo > 0 &&
            combo % 10 === 0
        ) {

            showBoostEffect();
        }


        /*
            QUESTION COMPLETE
        */

        if (
            currentPosition >=
            currentAnswer.length
        ) {

            processingAnswer = true;

            clearKeyboardHighlight();

            setTimeout(
                () => {

                    processingAnswer = false;

                    nextQuestion();

                },
                NEXT_QUESTION_DELAY
            );
        }


        return;
    }


    /* -----------------------------------------
       MISS
    ----------------------------------------- */

    miss++;

    combo = 0;

    showMissEffect();

    updateScoreHUD();

    highlightNextKey();
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

    currentQuestionIndex++;


    if (
        currentQuestionIndex >=
        sectionQuestions.length
    ) {

        finishSection();

        return;
    }


    showQuestion();
}


/* =========================================================
   FINISH SECTION
========================================================= */

function finishSection() {

    if (sectionFinished) {
        return;
    }


    sectionFinished = true;

    gameStarted = false;

    stopTimer();


    const sectionElapsed =
        sectionStartTime
            ? performance.now() -
              sectionStartTime
            : 0;


    const finalSectionTime =
        Math.max(
            0,
            sectionElapsed
        );


    sectionTimes[
        currentSection - 1
    ] = finalSectionTime;


    totalScore += score;

    totalMiss += miss;


    timer.textContent =
        formatTime(
            finalSectionTime
        );


    setGameState("FINISH");

    updateScoreHUD();

    updateProgress();


    resultTime.textContent =
        formatTime(
            finalSectionTime
        );

    resultScore.textContent =
        score;

    resultMiss.textContent =
        miss;


    clearKeyboardHighlight();

    showOverlay(resultOverlay);
}


/* =========================================================
   FINISH RACE
========================================================= */

function finishRace() {

    stopTimer();

    gameStarted = false;

    sectionFinished = true;


    const totalTime =
        sectionTimes.reduce(
            (total, value) =>
                total + value,
            0
        );


    finalTime.textContent =
        formatTime(totalTime);


    finalScore.textContent =
        totalScore;


    finalMiss.textContent =
        totalMiss;


    setGameState("FINISH");

    hideOverlay(resultOverlay);

    showOverlay(finalOverlay);

    clearKeyboardHighlight();
}


/* =========================================================
   RESTART
========================================================= */

function restartGame() {

    hideOverlay(finalOverlay);
    hideOverlay(resultOverlay);
    hideOverlay(countdownOverlay);

    resetAllState();

    currentSection = 1;

    prepareSection();
}


/* =========================================================
   SCORE HUD
========================================================= */

function updateScoreHUD() {

    scoreElement.textContent =
        score;

    missElement.textContent =
        miss;

    comboElement.textContent =
        combo;

    if (comboSide) {

        comboSide.textContent =
            combo;
    }


    const totalAttempts =
        score + miss;


    const accuracy =
        totalAttempts === 0
            ? 100
            : (
                score /
                totalAttempts
            ) * 100;


    accuracyElement.innerHTML =
        `${accuracy.toFixed(1)}<small>%</small>`;
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const total =
        sectionTotalChars;


    const current =
        sectionCharsTyped;


    let percent = 0;


    if (total > 0) {

        percent =
            (
                current /
                total
            ) * 100;
    }


    percent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


    progressCurrent.textContent =
        current;


    progressTotal.textContent =
        total;


    progressPercent.textContent =
        `${percent.toFixed(0)}%`;


    progressFill.style.width =
        `${percent}%`;


    moveRunner(percent);
}


/* =========================================================
   RUNNER
========================================================= */

function resetRunner() {

    runner.style.left =
        "0px";
}


function moveRunner(percent) {

    const raceArea =
        runner.closest(".race-area");


    if (!raceArea) {
        return;
    }


    const raceWidth =
        raceArea.clientWidth;


    const runnerWidth =
        runner.offsetWidth;


    const available =
        Math.max(
            0,
            raceWidth -
            runnerWidth
        );


    /*
        100%時でもFINISH側から
        少し余白を残す。
    */

    const cappedPercent =
        Math.min(
            percent,
            94
        );


    const left =
        available *
        (cappedPercent / 100);


    runner.style.left =
        `${left}px`;
}


/* =========================================================
   VIRTUAL KEYBOARD
========================================================= */

/*
    answerの文字から、
    画面上のキーを特定する。

    例:

    a → A
    A → A + Shift
    ! → Shift + 1
    @ → Shift + 2
    ? → Shift + /
    space → SPACE
*/


const SHIFT_SYMBOL_MAP = {

    "!": "1",
    "\"": "2",
    "#": "3",
    "$": "4",
    "%": "5",
    "&": "6",
    "'": "7",
    "(": "8",
    ")": "9",

    "_": "-",
    "+": ";",

    "*": "8",

    "<": ",",
    ">": ".",

    "?": "/",

    ":": ";",

    "{": "[",
    "}": "]",

    "|": "\\",

    "~": "^"
};


function normalizeKeyForKeyboard(char) {

    if (char === " ") {
        return " ";
    }


    return char.toLowerCase();
}


function getRequiredKeyboardKeys(char) {

    const result = [];


    if (char === " ") {

        result.push(" ");

        return result;
    }


    const lower =
        char.toLowerCase();


    /*
        英字の大文字はShiftが必要。
    */

    if (
        /[A-Z]/.test(char)
    ) {

        result.push("Shift");
    }


    /*
        記号
    */

    if (
        SHIFT_SYMBOL_MAP[
            char
        ]
    ) {

        result.push("Shift");

        result.push(
            SHIFT_SYMBOL_MAP[
                char
            ]
        );

        return result;
    }


    /*
        通常キー
    */

    result.push(lower);


    return result;
}


function highlightNextKey() {

    clearKeyboardHighlight();


    if (
        !currentAnswer ||
        currentPosition >=
        currentAnswer.length
    ) {
        return;
    }


    const nextChar =
        currentAnswer[
            currentPosition
        ];


    const requiredKeys =
        getRequiredKeyboardKeys(
            nextChar
        );


    requiredKeys.forEach(
        (requiredKey) => {

            keyboardKeys.forEach(
                (keyElement) => {

                    const key =
                        keyElement.dataset.key;

                    if (
                        key ===
                        requiredKey
                    ) {

                        keyElement.classList.add(
                            "active"
                        );
                    }
                }
            );
        }
    );
}


function clearKeyboardHighlight() {

    keyboardKeys.forEach(
        (keyElement) => {

            keyElement.classList.remove(
                "active"
            );
        }
    );
}


/* =========================================================
   PRESSED KEY EFFECT
========================================================= */

function flashPressedKey(inputChar) {

    const keysToFlash =
        getRequiredKeyboardKeys(
            inputChar
        );


    /*
        実際に押されたキーだけ
        光らせる。

        Shiftを押しながら
        大文字を入力した場合は
        Shiftも対象。
    */

    const matched = [];


    keysToFlash.forEach(
        (requiredKey) => {

            keyboardKeys.forEach(
                (keyElement) => {

                    if (
                        keyElement.dataset.key ===
                        requiredKey
                    ) {

                        keyElement.classList.add(
                            "pressed"
                        );

                        matched.push(
                            keyElement
                        );
                    }
                }
            );
        }
    );


    setTimeout(
        () => {

            matched.forEach(
                (keyElement) => {

                    keyElement.classList.remove(
                        "pressed"
                    );
                }
            );

        },
        100
    );
}


/* =========================================================
   VISUAL EFFECTS
========================================================= */

function showGoodEffect() {

    if (!goodEffect) {
        return;
    }


    goodEffect.classList.remove(
        "show"
    );


    /*
        reflowして再アニメーション。
    */

    void goodEffect.offsetWidth;


    goodEffect.classList.add(
        "show"
    );


    setTimeout(
        () => {

            goodEffect.classList.remove(
                "show"
            );

        },
        280
    );
}


function showMissEffect() {

    if (!missEffect) {
        return;
    }


    missEffect.classList.remove(
        "show"
    );

    void missEffect.offsetWidth;

    missEffect.classList.add(
        "show"
    );


    setTimeout(
        () => {

            missEffect.classList.remove(
                "show"
            );

        },
        320
    );
}


function showBoostEffect() {

    if (!boostEffect) {
        return;
    }


    boostEffect.classList.remove(
        "show"
    );

    void boostEffect.offsetWidth;

    boostEffect.classList.add(
        "show"
    );


    setTimeout(
        () => {

            boostEffect.classList.remove(
                "show"
            );

        },
        450
    );
}


/* =========================================================
   GAME STATE
========================================================= */

function setGameState(state) {

    gameState.textContent =
        state;
}


/* =========================================================
   OVERLAY
========================================================= */

function showOverlay(overlay) {

    if (!overlay) {
        return;
    }


    overlay.setAttribute(
        "aria-hidden",
        "false"
    );
}


function hideOverlay(overlay) {

    if (!overlay) {
        return;
    }


    overlay.setAttribute(
        "aria-hidden",
        "true"
    );
}


function isOverlayVisible(overlay) {

    return (
        overlay &&
        overlay.getAttribute(
            "aria-hidden"
        ) === "false"
    );
}


/* =========================================================
   FOCUS
========================================================= */

function focusTypingInput() {

    /*
        実際の入力判定はdocumentのkeydown。

        inputは「TYPE HERE」の
        視覚的要素として残す。
    */

    if (typingInput) {

        try {

            typingInput.focus();

        } catch (error) {
            /* no-op */
        }
    }
}


/* =========================================================
   SLEEP
========================================================= */

function sleep(milliseconds) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    console.error(message);

    stopTimer();

    gameStarted = false;

    countdownRunning = false;

    if (errorMessage) {

        errorMessage.textContent =
            message;
    }


    if (errorOverlay) {

        showOverlay(
            errorOverlay
        );
    }


    if (gameState) {

        gameState.textContent =
            "ERROR";
    }
}