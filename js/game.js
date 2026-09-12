/* =========================================================
   KIR RECREATION TOURNAMENT 2026
   めちゃむずキーボード早打ち駅伝
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

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


/* COUNTDOWN */

const COUNTDOWN_STEP = 1000;


/* QUESTION */

const NEXT_QUESTION_DELAY = 200;


/* SECTION RESULT */

const NEXT_SECTION_DELAY = 500;


/* SECTION TIME */

const MAX_SECTION_TIME = 150000;


/* HANDOFF */

const HANDOFF_TIME = 30000;



/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}



/* =========================================================
   DOM
========================================================= */

const DOM = {

    titleOverlay:
        $("title-overlay"),

    titleEvent:
        $(".title-event"),

    titleMain:
        $(".title-main"),

    titleSub:
        $(".title-sub"),

    titleMessage:
        $(".title-message"),


    sectionStartOverlay:
        $("section-start-overlay"),

    sectionStartNumber:
        $("section-start-number"),

    sectionStartJapanese:
        $("section-start-japanese"),

    sectionStartTeam:
        $("section-start-team"),

    sectionStartPlayer:
        $("section-start-player"),

    sectionStartPress:
        $("section-start-press"),


    sectionNumber:
        $("section-number"),

    teamName:
        $("team-name"),

    timer:
        $("timer"),


    runner:
        $("runner"),

    runnerImage:
        $("runner-image"),

    finishFlag:
        $("finish-flag"),


    questionNumber:
        $("question-number"),

    questionText:
        $("question-text"),

    romajiProgress:
        $("romaji-progress"),


    score:
        $("score"),

    miss:
        $("miss"),

    combo:
        $("combo"),

    comboSideValue:
        $("combo-side-value"),

    accuracy:
        $("accuracy"),


    progressPercent:
        $("progress-percent"),

    progressFill:
        $("progress-fill"),

    progressCurrent:
        $("progress-current"),

    progressTotal:
        $("progress-total"),


    goodEffect:
        $("good-effect"),

    missEffect:
        $("miss-effect"),

    boostEffect:
        $("boost-effect"),


    countdownOverlay:
        $("countdown-overlay"),

    countdown:
        $("countdown"),


    errorOverlay:
        $("error-overlay"),

    errorMessage:
        $("error-message"),

    errorReloadButton:
        $("error-reload-button"),


    resultOverlay:
        $("result-overlay"),

    resultSectionLabel:
        $("result-section-label"),

    resultTime:
        $("result-time"),

    resultScore:
        $("result-score"),

    resultMiss:
        $("result-miss"),

    resultNextMessage:
        $("result-next-message"),


    finalOverlay:
        $("final-overlay"),

    finalTime:
        $("final-time"),

    finalScore:
        $("final-score"),

    finalMiss:
        $("final-miss"),

    restartButton:
        $("restart-button"),


    typingInput:
        $("typing-input"),


    teamButtons:
        document.querySelectorAll(".team-select"),

    keys:
        document.querySelectorAll(".key")

};



/* =========================================================
   STATE
========================================================= */

const state = {

    initialized: false,


    /* TEAM */

    team: "A",


    /* DATA */

    sectionsData: [],


    /* CURRENT SECTION */

    currentSection: 0,

    sectionQuestions: [],


    /* CURRENT QUESTION */

    currentQuestionIndex: 0,

    currentAnswer: "",

    currentPosition: 0,


    /* SECTION SCORE */

    score: 0,

    miss: 0,

    combo: 0,


    /* TOTAL SCORE */

    totalScore: 0,

    totalMiss: 0,


    /* PROGRESS */

    sectionTotalChars: 0,

    sectionCharsTyped: 0,


    /* SECTION TIMER */

    sectionStartTime: 0,

    sectionElapsed: 0,

    timerInterval: null,


    /* SECTION TIMES */

    sectionTimes: [],


    /* GAME STATUS */

    gameStarted: false,

    sectionActive: false,

    sectionFinished: false,


    /* TITLE */

    titleScreen: true,


    /* DATA */

    dataReady: false,


    /* COUNTDOWN */

    countdownRunning: false,


    /* HANDOFF */

    handoffRunning: false,


    /* ANSWER */

    processingAnswer: false,


    /* FINAL */

    finalFinished: false

};



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

        bindEvents();

        readTeamFromURL();

        applyTeam();

        resetWholeGame();

        await loadAllSections();

        state.initialized = true;

    }

    catch (error) {

        console.error(error);

        showError(
            error.message ||
            "ゲームの初期化に失敗しました。"
        );

    }

}



/* =========================================================
   DOM CHECK
========================================================= */

function checkDOM() {

    const required = [

        ["title-overlay", DOM.titleOverlay],
        ["title-message", DOM.titleMessage],

        [
            "section-start-overlay",
            DOM.sectionStartOverlay
        ],

        [
            "section-start-number",
            DOM.sectionStartNumber
        ],

        [
            "section-start-japanese",
            DOM.sectionStartJapanese
        ],

        [
            "section-start-team",
            DOM.sectionStartTeam
        ],

        [
            "section-start-player",
            DOM.sectionStartPlayer
        ],

        [
            "section-start-press",
            DOM.sectionStartPress
        ],


        ["section-number", DOM.sectionNumber],
        ["team-name", DOM.teamName],
        ["timer", DOM.timer],


        ["runner", DOM.runner],
        ["runner-image", DOM.runnerImage],
        ["finish-flag", DOM.finishFlag],


        ["question-number", DOM.questionNumber],
        ["question-text", DOM.questionText],
        ["romaji-progress", DOM.romajiProgress],


        ["score", DOM.score],
        ["miss", DOM.miss],
        ["combo", DOM.combo],
        ["combo-side-value", DOM.comboSideValue],
        ["accuracy", DOM.accuracy],


        ["progress-percent", DOM.progressPercent],
        ["progress-fill", DOM.progressFill],
        ["progress-current", DOM.progressCurrent],
        ["progress-total", DOM.progressTotal],


        ["good-effect", DOM.goodEffect],
        ["miss-effect", DOM.missEffect],
        ["boost-effect", DOM.boostEffect],


        ["countdown-overlay", DOM.countdownOverlay],
        ["countdown", DOM.countdown],


        ["error-overlay", DOM.errorOverlay],
        ["error-message", DOM.errorMessage],
        ["error-reload-button", DOM.errorReloadButton],


        ["result-overlay", DOM.resultOverlay],
        ["result-section-label", DOM.resultSectionLabel],
        ["result-time", DOM.resultTime],
        ["result-score", DOM.resultScore],
        ["result-miss", DOM.resultMiss],


        ["final-overlay", DOM.finalOverlay],
        ["final-time", DOM.finalTime],
        ["final-score", DOM.finalScore],
        ["final-miss", DOM.finalMiss],
        ["restart-button", DOM.restartButton],


        ["typing-input", DOM.typingInput]

    ];


    for (
        const [name, element]
        of required
    ) {

        if (!element) {

            throw new Error(
                `HTML要素が見つかりません: ${name}`
            );

        }

    }


    if (
        DOM.teamButtons.length === 0
    ) {

        throw new Error(
            "TEAM SELECTボタンがありません。"
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


    DOM.teamButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        state.sectionActive ||
                        state.countdownRunning ||
                        state.handoffRunning ||
                        state.gameStarted
                    ) {

                        return;

                    }


                    const team =
                        button.dataset.team;


                    if (
                        VALID_TEAMS.includes(team)
                    ) {

                        state.team =
                            team;

                        applyTeam();

                        updateSectionStartScreen();

                    }

                }
            );

        }
    );


    DOM.restartButton.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );


    DOM.errorReloadButton.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );


    DOM.typingInput.addEventListener(
        "input",
        handleInput
    );


    window.addEventListener(
        "blur",
        clearPressedKeys
    );


    DOM.typingInput.addEventListener(
        "blur",
        () => {

            if (
                state.gameStarted
            ) {

                setTimeout(
                    focusTypingInput,
                    0
                );

            }

        }
    );

}



/* =========================================================
   KEY DOWN
========================================================= */

function handleKeyDown(event) {

    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {

        return;

    }


    /* =====================================================
       ENTER
    ===================================================== */

    if (
        event.key === "Enter"
    ) {

        event.preventDefault();


        /* FINAL */

        if (
            state.finalFinished
        ) {

            window.location.reload();

            return;

        }


        /* TITLE */

        if (
            state.titleScreen
        ) {

            if (
                !state.dataReady ||
                state.countdownRunning
            ) {

                return;

            }


            state.titleScreen =
                false;


            hideTitleScreen();


            showSectionStartScreen();

            return;

        }


        /* SECTION START */

        if (
            !state.sectionActive &&
            !state.sectionFinished &&
            !state.countdownRunning &&
            !state.handoffRunning
        ) {

            startCountdown();

            return;

        }


        return;

    }



    /* =====================================================
       TYPING
    ===================================================== */

    if (
        !state.gameStarted ||
        !state.sectionActive ||
        state.sectionFinished ||
        state.countdownRunning ||
        state.handoffRunning ||
        state.processingAnswer
    ) {

        return;

    }


    const key =
        normalizeCharacter(
            event.key
        );


    if (
        key === ""
    ) {

        return;

    }


    flashPressedKey(key);

    checkCharacter(key);

}



/* =========================================================
   INPUT
========================================================= */

function handleInput() {

    if (
        !state.gameStarted ||
        !state.sectionActive ||
        state.sectionFinished ||
        state.countdownRunning ||
        state.handoffRunning ||
        state.processingAnswer
    ) {

        DOM.typingInput.value = "";

        return;

    }


    const value =
        DOM.typingInput.value;


    if (
        !value
    ) {

        return;

    }


    for (
        const character of value
    ) {

        const key =
            normalizeCharacter(
                character
            );


        if (
            !key
        ) {

            continue;

        }


        flashPressedKey(key);

        checkCharacter(key);


        if (
            state.processingAnswer ||
            !state.gameStarted
        ) {

            break;

        }

    }


    DOM.typingInput.value = "";

}



/* =========================================================
   NORMALIZE
========================================================= */

function normalizeCharacter(character) {

    if (
        typeof character !== "string"
    ) {

        return "";

    }


    return character.toLowerCase();

}



/* =========================================================
   TEAM FROM URL
========================================================= */

function readTeamFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const team =
        (
            params.get("team") ||
            "A"
        ).toUpperCase();


    if (
        VALID_TEAMS.includes(team)
    ) {

        state.team =
            team;

    }

}



/* =========================================================
   APPLY TEAM
========================================================= */

function applyTeam() {

    const team =
        state.team;


    DOM.teamName.textContent =
        `TEAM ${team}`;


    DOM.runnerImage.src =
        `img/character/${team}team.png`;


    DOM.runnerImage.alt =
        `Team ${team}`;


    DOM.teamButtons.forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.team === team
            );

        }
    );



    updateSectionStartScreen();

}



/* =========================================================
   RESET
========================================================= */

function resetWholeGame() {

    stopTimer();

    clearPressedKeys();


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


    state.gameStarted = false;

    state.sectionActive = false;

    state.sectionFinished = false;


    state.titleScreen = true;

    state.dataReady = false;


    state.countdownRunning = false;

    state.handoffRunning = false;

    state.processingAnswer = false;

    state.finalFinished = false;


    hideAllOverlays();

    showTitleScreen();


    DOM.titleMessage.textContent =
        "LOADING...";


    DOM.questionText.textContent =
        "LOADING...";


    DOM.romajiProgress.textContent =
        "";


    DOM.timer.textContent =
        "00:00.000";


    updateHUD();

}



/* =========================================================
   LOAD CSV
========================================================= */

async function loadAllSections() {

    const loadedSections = [];


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


        if (
            !response.ok
        ) {

            throw new Error(
                `CSV読み込み失敗: ${file} (${response.status})`
            );

        }


        const text =
            await response.text();


        const questions =
            parseCSV(text);


        if (
            questions.length === 0
        ) {

            throw new Error(
                `問題が0件です: ${file}`
            );

        }


        loadedSections.push(
            questions
        );

    }


    state.sectionsData =
        loadedSections;


    state.dataReady =
        true;


    DOM.titleMessage.textContent =
        "PRESS ENTER";


    prepareSection(0);

}



/* =========================================================
   CSV PARSER
========================================================= */

function parseCSV(text) {

    const rows = [];

    let row = [];

    let cell = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


        if (
            char === '"'
        ) {

            if (
                insideQuotes &&
                text[i + 1] === '"'
            ) {

                cell += '"';

                i++;

            }

            else {

                insideQuotes =
                    !insideQuotes;

            }

        }

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(cell);

            cell = "";

        }

        else if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                text[i + 1] === "\n"
            ) {

                i++;

            }


            row.push(cell);

            cell = "";


            if (
                row.some(
                    value =>
                        value.trim() !== ""
                )
            ) {

                rows.push(row);

            }


            row = [];

        }

        else {

            cell += char;

        }

    }


    if (
        cell !== "" ||
        row.length > 0
    ) {

        row.push(cell);

    }


    if (
        row.some(
            value =>
                value.trim() !== ""
        )
    ) {

        rows.push(row);

    }


    if (
        rows.length < 2
    ) {

        return [];

    }


    const headers =
        rows[0].map(
            value =>
                value.trim()
        );


    const questions = [];


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const source =
            rows[i];


        const item = {};


        headers.forEach(
            (
                header,
                index
            ) => {

                item[header] =
                    (
                        source[index] ||
                        ""
                    ).trim();

            }
        );


        /*
         * 空行はスキップ。
         * CSV全体を止めない。
         */

        if (
            !item.answer
        ) {

            continue;

        }


        if (
            !item.display
        ) {

            item.display =
                item.title ||
                "";

        }


        item.answer =
            normalizeCSVAnswer(
                item.answer
            );


        if (
            !item.answer
        ) {

            continue;

        }


        questions.push(item);

    }


    return questions;

}



/* =========================================================
   CSV SPECIAL TEXT
========================================================= */

function normalizeCSVAnswer(value) {

    return value

        .replace(
            /\[半角スペース\]/g,
            " "
        )

        .replace(
            /\[全角スペース\]/g,
            "　"
        )

        .replace(
            /\[改行\]/g,
            "\n"
        )

        .replace(
            /\[タブ\]/g,
            "\t"
        )

        .toLowerCase()

        .trim();

}



/* =========================================================
   PREPARE SECTION
========================================================= */

function prepareSection(sectionIndex) {

    stopTimer();

    clearPressedKeys();


    state.currentSection =
        sectionIndex;


    state.sectionQuestions =
        state.sectionsData[
            sectionIndex
        ] || [];


    state.currentQuestionIndex =
        0;


    state.currentAnswer =
        "";

    state.currentPosition =
        0;


    state.score =
        0;

    state.miss =
        0;

    state.combo =
        0;


    state.sectionCharsTyped =
        0;


    state.sectionTotalChars =
        state.sectionQuestions.reduce(
            (
                total,
                question
            ) => {

                return (
                    total +
                    question.answer.length
                );

            },
            0
        );


    state.sectionStartTime =
        0;

    state.sectionElapsed =
        0;


    state.gameStarted =
        false;

    state.sectionActive =
        false;

    state.sectionFinished =
        false;

    state.countdownRunning =
        false;

    state.handoffRunning =
        false;

    state.processingAnswer =
        false;


    updateSectionHeader();

    updateHUD();

    resetRunner();

    showQuestion();

    updateSectionStartScreen();

}



/* =========================================================
   SECTION HEADER
========================================================= */

function updateSectionHeader() {

    const section =
        state.currentSection + 1;


    DOM.sectionNumber.textContent =
        section;


    DOM.teamName.textContent =
        `TEAM ${state.team}`;

}



/* =========================================================
   SECTION START SCREEN
========================================================= */

function updateSectionStartScreen() {

    const section =
        state.currentSection + 1;


    DOM.sectionStartNumber.textContent =
        section;


    DOM.sectionStartJapanese.textContent =
        `第 ${section} 区`;


    DOM.sectionStartTeam.textContent =
        `TEAM ${state.team}`;


    DOM.sectionStartPlayer.textContent =
        `PLAYER ${section}`;


    DOM.sectionStartPress.textContent =
        "PRESS ENTER";

}



/* =========================================================
   SHOW SECTION START
========================================================= */

function showSectionStartScreen() {

    if (
        state.sectionFinished ||
        state.sectionActive
    ) {

        return;

    }


    updateSectionStartScreen();


    DOM.sectionStartOverlay.classList.remove(
        "hidden"
    );

}



/* =========================================================
   HIDE SECTION START
========================================================= */

function hideSectionStartScreen() {

    DOM.sectionStartOverlay.classList.add(
        "hidden"
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
     * ここは「新しい問題」を
     * 開始するときだけ呼ぶ。
     *
     * 区間途中の選手交代はないため、
     * 交代処理からは呼ばない。
     */

    state.currentAnswer =
        question.answer;


    state.currentPosition =
        0;


    DOM.questionNumber.textContent =
        `${state.currentQuestionIndex + 1} / ${state.sectionQuestions.length}`;


    DOM.questionText.textContent =
        question.display;


    updateRomajiProgress();

    updateRequiredKey();

}



/* =========================================================
   ROMAJI PROGRESS
========================================================= */

function updateRomajiProgress() {

    const answer =
        state.currentAnswer;


    const position =
        state.currentPosition;


    DOM.romajiProgress.innerHTML =
        "";


    if (
        !answer
    ) {

        return;

    }


    const fragment =
        document.createDocumentFragment();


    for (
        let i = 0;
        i < answer.length;
        i++
    ) {

        const span =
            document.createElement(
                "span"
            );


        span.textContent =
            answer[i];


        if (
            i < position
        ) {

            span.className =
                "typed";

        }

        else if (
            i === position
        ) {

            span.className =
                "current";

        }

        else {

            span.className =
                "remaining";

        }


        fragment.appendChild(span);

    }


    DOM.romajiProgress.appendChild(
        fragment
    );

}



/* =========================================================
   CHARACTER CHECK
========================================================= */

function checkCharacter(character) {

    if (
        !state.currentAnswer
    ) {

        return;

    }


    const expected =
        state.currentAnswer[
            state.currentPosition
        ];


    if (
        character === expected
    ) {

        state.currentPosition++;

        state.sectionCharsTyped++;

        state.combo++;

        state.score++;


        showGoodEffect();

        updateHUD();

        updateRomajiProgress();

        updateRequiredKey();


        if (
            state.currentPosition >=
            state.currentAnswer.length
        ) {

            completeQuestion();

        }

    }

    else {

        state.miss++;

        state.combo = 0;


        showMissEffect();

        updateHUD();

    }

}



/* =========================================================
   COMPLETE QUESTION
========================================================= */

async function completeQuestion() {

    if (
        state.processingAnswer
    ) {

        return;

    }


    state.processingAnswer =
        true;


    updateRunner();


    await sleep(
        NEXT_QUESTION_DELAY
    );


    state.processingAnswer =
        false;


    /*
     * 最後の問題なら
     * 次の問題には行かない。
     *
     * この瞬間に区間終了。
     */

    if (
        state.currentQuestionIndex >=
        state.sectionQuestions.length - 1
    ) {

        finishSection();

        return;

    }


    /*
     * 同じ選手が
     * 次の問題を続けてプレイ。
     */

    state.currentQuestionIndex++;

    showQuestion();

}



/* =========================================================
   START COUNTDOWN
========================================================= */

async function startCountdown() {

    if (
        state.countdownRunning ||
        state.sectionActive ||
        state.sectionFinished
    ) {

        return;

    }


    if (
        !state.sectionQuestions.length
    ) {

        showError(
            "この区間の問題が読み込まれていません。"
        );

        return;

    }


    state.countdownRunning =
        true;


    hideSectionStartScreen();

    hideTitleScreen();


    DOM.countdownOverlay.classList.remove(
        "hidden"
    );


    const sequence = [
        "3",
        "2",
        "1",
        "GO!!"
    ];


    for (
        const value of sequence
    ) {

        DOM.countdown.textContent =
            value;


        DOM.countdown.classList.remove(
            "countdown-pop"
        );


        void DOM.countdown.offsetWidth;


        DOM.countdown.classList.add(
            "countdown-pop"
        );


        await sleep(
            COUNTDOWN_STEP
        );

    }


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    state.countdownRunning =
        false;


    /*
     * GO!!の瞬間から
     * 区間タイマー開始。
     */

    startSection();

}



/* =========================================================
   START SECTION
========================================================= */

function startSection() {

    if (
        state.sectionActive
    ) {

        return;

    }


    state.sectionActive =
        true;


    state.gameStarted =
        true;


    state.sectionFinished =
        false;


    state.sectionStartTime =
        performance.now();


    state.sectionElapsed =
        0;


    startTimer();


    focusTypingInput();

}



/* =========================================================
   SECTION TIMER
========================================================= */

function startTimer() {

    stopTimer();


    updateTimer();


    state.timerInterval =
        setInterval(
            updateTimer,
            10
        );

}



/* =========================================================
   UPDATE TIMER
========================================================= */

function updateTimer() {

    if (
        !state.sectionActive
    ) {

        return;

    }


    state.sectionElapsed =
        performance.now() -
        state.sectionStartTime;


    if (
        state.sectionElapsed >=
        MAX_SECTION_TIME
    ) {

        state.sectionElapsed =
            MAX_SECTION_TIME;


        DOM.timer.textContent =
            formatTime(
                MAX_SECTION_TIME
            );


        finishSection();

        return;

    }


    DOM.timer.textContent =
        formatTime(
            state.sectionElapsed
        );

}



/* =========================================================
   STOP TIMER
========================================================= */

function stopTimer() {

    if (
        state.timerInterval !== null
    ) {

        clearInterval(
            state.timerInterval
        );

        state.timerInterval =
            null;

    }

}



/* =========================================================
   FINISH SECTION
========================================================= */

function finishSection() {

    if (
        state.sectionFinished
    ) {

        return;

    }


    /*
     * 区間終了。
     *
     * ここで初めて
     * プレイヤーが終了する。
     */

    state.sectionFinished =
        true;


    state.sectionActive =
        false;


    state.gameStarted =
        false;


    state.countdownRunning =
        false;


    state.handoffRunning =
        false;


    stopTimer();

    clearPressedKeys();


    const elapsed =
        Math.min(
            state.sectionElapsed,
            MAX_SECTION_TIME
        );


    state.sectionElapsed =
        elapsed;


    state.sectionTimes[
        state.currentSection
    ] = elapsed;


    DOM.timer.textContent =
        formatTime(elapsed);


    updateRunnerToFinish();


    showSectionResult();



    /*
     * 第6区なら
     * 30秒交代なし。
     *
     * それ以外は
     * 結果画面 → 30秒交代。
     */

}



/* =========================================================
   SECTION RESULT
========================================================= */

function showSectionResult() {

    const section =
        state.currentSection + 1;


    DOM.resultSectionLabel.textContent =
        `SECTION ${section}`;


    DOM.resultTime.textContent =
        formatTime(
            state.sectionElapsed
        );


    DOM.resultScore.textContent =
        state.score;


    DOM.resultMiss.textContent =
        state.miss;


    if (
        state.currentSection <
        SECTION_FILES.length - 1
    ) {

        DOM.resultNextMessage.textContent =
            "NEXT SECTION IN 30 SECONDS";

    }

    else {

        DOM.resultNextMessage.textContent =
            "RACE COMPLETE";

    }


    DOM.resultOverlay.classList.remove(
        "hidden"
    );


    if (
        state.currentSection <
        SECTION_FILES.length - 1
    ) {

        setTimeout(
            () => {

                if (
                    state.sectionFinished
                ) {

                    startHandoff();

                }

            },
            NEXT_SECTION_DELAY
        );

    }

    else {

        setTimeout(
            finishRace,
            NEXT_SECTION_DELAY
        );

    }

}



/* =========================================================
   HANDOFF
========================================================= */

async function startHandoff() {

    if (
        state.handoffRunning
    ) {

        return;

    }


    state.handoffRunning =
        true;


    DOM.resultOverlay.classList.add(
        "hidden"
    );


    DOM.countdownOverlay.classList.remove(
        "hidden"
    );


    /*
     * 30秒の交代時間。
     *
     * この30秒は
     * 次区間のPRESS ENTER開始時間
     * ではなく、
     * 純粋な選手交代時間。
     */

    for (
        let remaining = 30;
        remaining >= 1;
        remaining--
    ) {

        DOM.countdown.textContent =
            remaining;


        DOM.countdown.classList.remove(
            "countdown-pop"
        );


        void DOM.countdown.offsetWidth;


        DOM.countdown.classList.add(
            "countdown-pop"
        );


        await sleep(1000);

    }


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    state.handoffRunning =
        false;


    /*
     * 次区間へ。
     */

    const nextSection =
        state.currentSection + 1;


    prepareSection(
        nextSection
    );


    showSectionStartScreen();

}



/* =========================================================
   NEXT SECTION
========================================================= */

function handleResultNext() {

    /*
     * 現在の区間結果を
     * TOTALへ加算。
     */

    state.totalScore +=
        state.score;


    state.totalMiss +=
        state.miss;


    if (
        state.currentSection >=
        SECTION_FILES.length - 1
    ) {

        finishRace();

        return;

    }


    const nextSection =
        state.currentSection + 1;


    prepareSection(
        nextSection
    );


    showSectionStartScreen();

}



/* =========================================================
   FINISH RACE
========================================================= */

function finishRace() {

    if (
        state.finalFinished
    ) {

        return;

    }


    state.finalFinished =
        true;


    state.sectionActive =
        false;


    state.gameStarted =
        false;


    state.sectionFinished =
        true;


    stopTimer();

    clearPressedKeys();


    /*
     * 第6区のスコアを
     * TOTALへ加算。
     */

    state.totalScore +=
        state.score;


    state.totalMiss +=
        state.miss;


    /*
     * 6区間タイムを合計。
     */

    const sectionTotal =
        state.sectionTimes.reduce(
            (
                total,
                value
            ) => {

                return total + value;

            },
            0
        );


    /*
     * 30秒交代 × 5回
     */

    const handoffTotal =
        HANDOFF_TIME *
        (
            SECTION_FILES.length - 1
        );


    const totalTime =
        sectionTotal +
        handoffTotal;


    DOM.finalTime.textContent =
        formatTime(totalTime);


    DOM.finalScore.textContent =
        state.totalScore;


    DOM.finalMiss.textContent =
        state.totalMiss;


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    DOM.sectionStartOverlay.classList.add(
        "hidden"
    );


    DOM.finalOverlay.classList.remove(
        "hidden"
    );

}



/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    DOM.score.textContent =
        state.score;


    DOM.miss.textContent =
        state.miss;


    DOM.combo.textContent =
        state.combo;


    DOM.comboSideValue.textContent =
        state.combo;


    const attempts =
        state.sectionCharsTyped +
        state.miss;


    const accuracy =
        attempts > 0
            ? (
                state.sectionCharsTyped /
                attempts
            ) * 100
            : 100;


    DOM.accuracy.textContent =
        `${accuracy.toFixed(1)}%`;


    const total =
        state.sectionTotalChars;


    const current =
        state.sectionCharsTyped;


    let percent =
        total > 0
            ? (
                current /
                total
            ) * 100
            : 0;


    percent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


    DOM.progressPercent.textContent =
        `${Math.floor(percent)}%`;


    DOM.progressCurrent.textContent =
        current;


    DOM.progressTotal.textContent =
        total;


    DOM.progressFill.style.width =
        `${percent}%`;


    updateRunner();

}



/* =========================================================
   RUNNER
========================================================= */

function resetRunner() {

    DOM.runner.style.left =
        "4%";

    DOM.runner.classList.remove(
        "runner-finish"
    );

}



function updateRunner() {

    if (
        state.sectionTotalChars <= 0
    ) {

        return;

    }


    const progress =
        state.sectionCharsTyped /
        state.sectionTotalChars;


    const left =
        4 +
        (
            Math.min(
                1,
                progress
            ) * 88
        );


    DOM.runner.style.left =
        `${left}%`;

}



function updateRunnerToFinish() {

    DOM.runner.style.left =
        "92%";


    DOM.runner.classList.add(
        "runner-finish"
    );

}



/* =========================================================
   FINISH FLAG
========================================================= */

function resetFinishFlag() {

    DOM.finishFlag.classList.remove(
        "finish-active"
    );

}



/* =========================================================
   REQUIRED KEY
========================================================= */

function updateRequiredKey() {

    const expected =
        state.currentAnswer[
            state.currentPosition
        ];


    DOM.keys.forEach(
        keyButton => {

            keyButton.classList.remove(
                "required"
            );

        }
    );


    if (
        expected === undefined
    ) {

        return;

    }


    const normalized =
        normalizeCharacter(
            expected
        );


    DOM.keys.forEach(
        keyButton => {

            if (
                keyButton.dataset.key ===
                normalized
            ) {

                keyButton.classList.add(
                    "required"
                );

            }

        }
    );

}



/* =========================================================
   KEYBOARD EFFECT
========================================================= */

function flashPressedKey(key) {

    const normalized =
        normalizeCharacter(key);


    DOM.keys.forEach(
        button => {

            if (
                button.dataset.key ===
                normalized
            ) {

                button.classList.add(
                    "pressed"
                );


                setTimeout(
                    () => {

                        button.classList.remove(
                            "pressed"
                        );

                    },
                    100
                );

            }

        }
    );

}



function clearPressedKeys() {

    DOM.keys.forEach(
        button => {

            button.classList.remove(
                "pressed"
            );

        }
    );

}



/* =========================================================
   EFFECTS
========================================================= */

function showGoodEffect() {

    DOM.goodEffect.classList.remove(
        "show"
    );


    void DOM.goodEffect.offsetWidth;


    DOM.goodEffect.classList.add(
        "show"
    );

}



function showMissEffect() {

    DOM.missEffect.classList.remove(
        "show"
    );


    void DOM.missEffect.offsetWidth;


    DOM.missEffect.classList.add(
        "show"
    );

}



/* =========================================================
   FOCUS
========================================================= */

function focusTypingInput() {

    if (
        state.gameStarted
    ) {

        DOM.typingInput.focus();

    }

}



/* =========================================================
   TITLE
========================================================= */

function showTitleScreen() {

    DOM.titleOverlay.classList.remove(
        "hidden"
    );

}



function hideTitleScreen() {

    DOM.titleOverlay.classList.add(
        "hidden"
    );

}



/* =========================================================
   OVERLAYS
========================================================= */

function hideAllOverlays() {

    DOM.titleOverlay.classList.add(
        "hidden"
    );

    DOM.sectionStartOverlay.classList.add(
        "hidden"
    );

    DOM.countdownOverlay.classList.add(
        "hidden"
    );

    DOM.errorOverlay.classList.add(
        "hidden"
    );

    DOM.resultOverlay.classList.add(
        "hidden"
    );

    DOM.finalOverlay.classList.add(
        "hidden"
    );

}



/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    DOM.errorMessage.textContent =
        message;


    DOM.errorOverlay.classList.remove(
        "hidden"
    );

}



/* =========================================================
   FORMAT TIME
========================================================= */

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
            (
                ms % 60000
            ) / 1000
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
   DEBUG
========================================================= */

window.KIR_GAME = {

    GAME_ID,

    state,

    startCountdown,

    finishSection,

    prepareSection,

    showSectionStartScreen

};