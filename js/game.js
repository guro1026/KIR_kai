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


/*
 * 1人 = 1区間
 *
 * 各区間の制限時間
 */
const PLAYER_TIME = 150000;


/*
 * カウントダウン
 */
const COUNTDOWN_STEP = 1000;


/*
 * 問題切り替え演出
 */
const NEXT_QUESTION_DELAY = 200;


/*
 * 区間結果表示まで
 */
const NEXT_SECTION_DELAY = 500;


/* =========================================================
   DOM
========================================================= */

function $(id) {

    return document.getElementById(id);

}


const DOM = {

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


    titleOverlay:
        $("title-overlay"),

    titleSection:
        $("title-section"),

    titlePressEnter:
        $("title-press-enter"),


    errorOverlay:
        $("error-overlay"),

    errorMessage:
        $("error-message"),

    errorReloadButton:
        $("error-reload-button"),


    resultOverlay:
        $("result-overlay"),

    resultSection:
        $("result-section"),

    resultTime:
        $("result-time"),

    resultScore:
        $("result-score"),

    resultMiss:
        $("result-miss"),

    resultNextButton:
        $("result-next-button"),


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

    initialized:
        false,


    /*
     * TEAM
     */
    team:
        "A",


    /*
     * CSV
     */
    sectionsData:
        [],


    /*
     * 現在の区間
     *
     * 0 = 第1区
     * 1 = 第2区
     * ...
     */
    currentSection:
        0,


    /*
     * 現在区間の問題
     */
    sectionQuestions:
        [],


    /*
     * 現在問題
     */
    currentQuestionIndex:
        0,


    /*
     * 現在問題の正解
     */
    currentAnswer:
        "",


    /*
     * 現在の入力位置
     */
    currentPosition:
        0,


    /*
     * 区間スコア
     */
    score:
        0,


    /*
     * 区間MISS
     */
    miss:
        0,


    /*
     * COMBO
     */
    combo:
        0,


    /*
     * 全区間合計
     */
    totalScore:
        0,

    totalMiss:
        0,


    /*
     * 現在区間の総文字数
     */
    sectionTotalChars:
        0,


    /*
     * 現在区間で入力済み文字数
     */
    sectionCharsTyped:
        0,


    /*
     * 区間開始時刻
     */
    sectionStartTime:
        0,


    /*
     * 区間経過時間
     */
    sectionElapsed:
        0,


    /*
     * 区間タイマー
     */
    timerInterval:
        null,


    /*
     * 現在の区間が実際に走っているか
     */
    sectionActive:
        false,


    /*
     * ゲーム入力可能
     */
    gameStarted:
        false,


    /*
     * 区間結果表示中
     */
    sectionFinished:
        false,


    /*
     * 初期 / 区間タイトル画面
     */
    titleScreen:
        true,


    /*
     * CSVロード済み
     */
    dataReady:
        false,


    /*
     * 3-2-1-GO中
     */
    countdownRunning:
        false,


    /*
     * 問題処理中
     */
    processingAnswer:
        false,


    /*
     * 2:30到達
     */
    timeExpired:
        false,


    /*
     * 2:30時点の位置を保存
     */
    savedQuestionIndex:
        0,

    savedInputPosition:
        0,


    /*
     * 各区間タイム
     */
    sectionTimes:
        [],


    /*
     * 最終結果
     */
    finalFinished:
        false

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

    const required = [

        ["section-number", DOM.sectionNumber],
        ["team-name", DOM.teamName],
        ["timer", DOM.timer],

        ["runner", DOM.runner],
        ["runner-image", DOM.runnerImage],

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

        ["title-overlay", DOM.titleOverlay],
        ["title-section", DOM.titleSection],
        ["title-press-enter", DOM.titlePressEnter],

        ["error-overlay", DOM.errorOverlay],
        ["error-message", DOM.errorMessage],
        ["error-reload-button", DOM.errorReloadButton],

        ["result-overlay", DOM.resultOverlay],
        ["result-section", DOM.resultSection],
        ["result-time", DOM.resultTime],
        ["result-score", DOM.resultScore],
        ["result-miss", DOM.resultMiss],
        ["result-next-button", DOM.resultNextButton],

        ["final-overlay", DOM.finalOverlay],
        ["final-time", DOM.finalTime],
        ["final-score", DOM.finalScore],
        ["final-miss", DOM.finalMiss],
        ["restart-button", DOM.restartButton],

        ["typing-input", DOM.typingInput]

    ];


    const missing = required
        .filter(item => !item[1])
        .map(item => item[0]);


    if (missing.length > 0) {

        throw new Error(
            "HTML要素が見つかりません:\n" +
            missing.join(", ")
        );

    }

}



/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {


    /*
     * キーボード
     */
    document.addEventListener(
        "keydown",
        handleKeyDown
    );


    /*
     * TEAM
     */
    DOM.teamButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    state.sectionActive ||
                    state.countdownRunning
                ) {

                    return;

                }


                const team =
                    button.dataset.team;


                if (
                    VALID_TEAMS.includes(team)
                ) {

                    state.team = team;

                    applyTeam();

                }

            }
        );

    });


    /*
     * SECTION NEXT
     */
    DOM.resultNextButton.addEventListener(
        "click",
        handleResultNext
    );


    /*
     * RESTART
     */
    DOM.restartButton.addEventListener(
        "click",
        () => {

            location.reload();

        }
    );


    /*
     * ERROR RELOAD
     */
    DOM.errorReloadButton.addEventListener(
        "click",
        () => {

            location.reload();

        }
    );


    /*
     * 仮想キーボード
     */
    DOM.keys.forEach(key => {

        key.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();

            }
        );

    });


    /*
     * ブラウザのフォーカスが外れた場合
     */
    window.addEventListener(
        "blur",
        clearPressedKeys
    );

}



/* =========================================================
   KEYBOARD INPUT
========================================================= */

function handleKeyDown(event) {

    /*
     * Ctrl / Alt / Meta は無視
     */
    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {

        return;

    }


    /*
     * FINAL
     */
    if (
        event.key === "Enter" &&
        state.finalFinished
    ) {

        location.reload();

        return;

    }


    /*
     * 区間スタート画面
     */
    if (
        event.key === "Enter" &&
        state.titleScreen
    ) {

        event.preventDefault();

        if (
            state.dataReady &&
            !state.countdownRunning
        ) {

            startCountdown();

        }

        return;

    }


    /*
     * 区間結果
     */
    if (
        event.key === "Enter" &&
        state.sectionFinished
    ) {

        event.preventDefault();

        handleResultNext();

        return;

    }


    /*
     * ゲーム中でなければ入力不可
     */
    if (
        !state.gameStarted ||
        !state.sectionActive ||
        state.countdownRunning ||
        state.sectionFinished ||
        state.finalFinished
    ) {

        return;

    }


    /*
     * Enter は入力文字ではない
     */
    if (event.key === "Enter") {

        event.preventDefault();

        return;

    }


    /*
     * Shift 単独は無視
     */
    if (event.key === "Shift") {

        return;

    }


    /*
     * 1文字だけ取得
     */
    const key =
        normalizeKey(event.key);


    if (!key) {

        return;

    }


    /*
     * 通常文字のみ
     */
    if (key.length !== 1) {

        return;

    }


    event.preventDefault();


    flashPressedKey(key);

    checkCharacter(key);

}



/* =========================================================
   NORMALIZE
========================================================= */

function normalizeKey(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .toLowerCase();

}



/* =========================================================
   TEAM URL
========================================================= */

function readTeamFromURL() {

    try {

        const params =
            new URLSearchParams(
                location.search
            );


        const team =
            String(
                params.get("team") || "A"
            ).toUpperCase();


        if (
            VALID_TEAMS.includes(team)
        ) {

            state.team = team;

        }

    }
    catch {

        state.team = "A";

    }

}



/* =========================================================
   APPLY TEAM
========================================================= */

function applyTeam() {

    DOM.teamName.textContent =
        `TEAM ${state.team}`;


    DOM.runnerImage.src =
        `img/character/${state.team}team.png`;


    DOM.runnerImage.alt =
        `TEAM ${state.team}`;


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

    state.sectionActive = false;

    state.gameStarted = false;

    state.sectionFinished = false;

    state.titleScreen = true;

    state.dataReady = false;

    state.countdownRunning = false;

    state.processingAnswer = false;

    state.timeExpired = false;

    state.savedQuestionIndex = 0;

    state.savedInputPosition = 0;

    state.finalFinished = false;


    hideAllOverlays();


    document.body.classList.add(
        "ready"
    );


    updateSectionNumber();

    resetHUD();

    resetProgress();

    resetRunner();


    DOM.titleSection.textContent =
        "第1区スタート";


    DOM.titlePressEnter.textContent =
        "LOADING...";


    DOM.questionText.textContent =
        "LOADING...";


    DOM.romajiProgress.textContent =
        "CSV DATA LOADING...";


    focusInput();

}



/* =========================================================
   LOAD ALL CSV
========================================================= */

async function loadAllSections() {

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
                    `CSV読み込み失敗: ${file}\n` +
                    `HTTP ${response.status}`
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
                    `${file} に有効な問題がありません。`
                );

            }


            loadedSections.push(
                questions
            );

        }


        state.sectionsData =
            loadedSections;


        state.dataReady = true;


        prepareSection(0);


        /*
         * 最初の区間タイトル
         */
        showSectionTitle();


    }
    catch (error) {

        console.error(error);

        showError(
            error instanceof Error
                ? error.message
                : String(error)
        );

    }

}



/* =========================================================
   CSV PARSER
========================================================= */

function parseCSV(text) {

    const rows = [];

    let row = [];

    let cell = "";

    let inQuotes = false;


    /*
     * BOM除去
     */
    text =
        String(text || "")
            .replace(/^\uFEFF/, "");


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];

        const next =
            text[i + 1];


        if (
            char === '"' &&
            inQuotes &&
            next === '"'
        ) {

            cell += '"';

            i++;

            continue;

        }


        if (char === '"') {

            inQuotes =
                !inQuotes;

            continue;

        }


        if (
            char === "," &&
            !inQuotes
        ) {

            row.push(cell);

            cell = "";

            continue;

        }


        if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !inQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }


            row.push(cell);

            cell = "";


            if (
                row.some(
                    value =>
                        String(value).trim() !== ""
                )
            ) {

                rows.push(row);

            }


            row = [];

            continue;

        }


        cell += char;

    }


    if (
        cell !== "" ||
        row.length > 0
    ) {

        row.push(cell);

        if (
            row.some(
                value =>
                    String(value).trim() !== ""
            )
        ) {

            rows.push(row);

        }

    }


    if (rows.length < 2) {

        return [];

    }


    const headers =
        rows[0].map(
            value =>
                String(value)
                    .trim()
                    .toLowerCase()
        );


    const displayIndex =
        headers.indexOf("display");

    const answerIndex =
        headers.indexOf("answer");

    const questionNoIndex =
        headers.indexOf("question_no");

    const sectionIndex =
        headers.indexOf("section");

    const titleIndex =
        headers.indexOf("title");


    if (
        displayIndex === -1 ||
        answerIndex === -1
    ) {

        throw new Error(
            "CSVに display または answer 列がありません。"
        );

    }


    const result = [];


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const currentRow =
            rows[i];


        const rawDisplay =
            currentRow[displayIndex] ?? "";


        const rawAnswer =
            currentRow[answerIndex] ?? "";


        const display =
            decodeSpecialSpaces(
                rawDisplay.trim()
            );


        const answer =
            decodeSpecialSpaces(
                rawAnswer.trim()
            ).toLowerCase();


        /*
         * 空行はスキップ
         *
         * ここで return して
         * CSV全体を中断しない。
         */
        if (!answer) {

            console.warn(
                "answerが空のCSV行をスキップ:",
                i + 1
            );

            continue;

        }


        result.push({

            questionNo:
                questionNoIndex >= 0
                    ? String(
                        currentRow[
                            questionNoIndex
                        ] ?? i
                    ).trim()
                    : String(i),

            section:
                sectionIndex >= 0
                    ? String(
                        currentRow[
                            sectionIndex
                        ] ?? ""
                    ).trim()
                    : "",

            title:
                titleIndex >= 0
                    ? String(
                        currentRow[
                            titleIndex
                        ] ?? ""
                    ).trim()
                    : "",

            display:
                display,

            answer:
                answer

        });

    }


    return result;

}



/* =========================================================
   SPECIAL SPACE
========================================================= */

function decodeSpecialSpaces(value) {

    return String(value)

        .replace(
            /\[半角スペース\]/g,
            " "
        )

        .replace(
            /\[全角スペース\]/g,
            "　"
        );

}



/* =========================================================
   PREPARE SECTION
========================================================= */

function prepareSection(sectionIndex) {

    stopTimer();


    if (
        sectionIndex < 0 ||
        sectionIndex >= state.sectionsData.length
    ) {

        finishRace();

        return;

    }


    state.currentSection =
        sectionIndex;


    state.sectionQuestions =
        state.sectionsData[
            sectionIndex
        ];


    state.currentQuestionIndex = 0;

    state.currentAnswer = "";

    state.currentPosition = 0;


    state.score = 0;

    state.miss = 0;

    state.combo = 0;


    state.sectionCharsTyped = 0;

    state.sectionTotalChars =
        state.sectionQuestions.reduce(
            (total, question) =>
                total + question.answer.length,
            0
        );


    state.sectionElapsed = 0;

    state.sectionStartTime = 0;


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


    showQuestion();


    showSectionTitle();

}



/* =========================================================
   SECTION TITLE
========================================================= */

function showSectionTitle() {

    const sectionNo =
        state.currentSection + 1;


    DOM.titleSection.textContent =
        `第${sectionNo}区スタート`;


    DOM.titlePressEnter.textContent =
        "PRESS ENTER";


    DOM.titleOverlay.classList.remove(
        "hidden"
    );


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    state.titleScreen = true;


    document.body.classList.add(
        "ready"
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
     * 日本語のお題
     */
    DOM.questionText.textContent =
        question.display;


    /*
     * 実際の入力判定
     */
    state.currentAnswer =
        question.answer.toLowerCase();


    /*
     * 問題を新しく表示した時だけ
     * 入力位置を0にする。
     *
     * 2:30終了時にはここを
     * 呼ばない。
     */
    state.currentPosition = 0;


    DOM.questionNumber.textContent =
        `${state.currentQuestionIndex + 1} / ${state.sectionQuestions.length}`;


    updateRomajiProgress();

    updateRequiredKey();

    clearInput();

    focusInput();

}



/* =========================================================
   ROMAJI PROGRESS
========================================================= */

function updateRomajiProgress() {

    const answer =
        state.currentAnswer;


    const position =
        state.currentPosition;


    if (!answer) {

        DOM.romajiProgress.textContent =
            "";

        return;

    }


    DOM.romajiProgress.innerHTML =
        "";


    const fragment =
        document.createDocumentFragment();


    for (
        let i = 0;
        i < answer.length;
        i++
    ) {

        const span =
            document.createElement("span");


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


        fragment.appendChild(
            span
        );

    }


    DOM.romajiProgress.appendChild(
        fragment
    );

}



/* =========================================================
   CHECK CHARACTER
========================================================= */

function checkCharacter(input) {

    if (
        state.processingAnswer ||
        !state.gameStarted ||
        !state.sectionActive
    ) {

        return;

    }


    const expected =
        state.currentAnswer[
            state.currentPosition
        ];


    if (!expected) {

        return;

    }


    if (
        input === expected
    ) {

        handleCorrect(
            input
        );

    }
    else {

        handleMiss();

    }

}



/* =========================================================
   CORRECT
========================================================= */

function handleCorrect(input) {

    state.currentPosition++;

    state.sectionCharsTyped++;

    state.combo++;


    /*
     * スコア
     */
    state.score += 10;


    /*
     * コンボボーナス
     */
    if (
        state.combo > 1
    ) {

        state.score +=
            Math.min(
                state.combo,
                20
            );

    }


    flashEffect(
        DOM.goodEffect
    );


    if (
        state.combo > 0 &&
        state.combo % 10 === 0
    ) {

        flashEffect(
            DOM.boostEffect
        );

    }


    updateHUD();

    updateProgress();

    updateRomajiProgress();

    updateRequiredKey();


    /*
     * 問題完了
     */
    if (
        state.currentPosition >=
        state.currentAnswer.length
    ) {

        completeQuestion();

    }

}



/* =========================================================
   MISS
========================================================= */

function handleMiss() {

    state.miss++;

    state.combo = 0;


    flashEffect(
        DOM.missEffect
    );


    updateHUD();

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


    state.processingAnswer = true;


    const isLastQuestion =
        state.currentQuestionIndex >=
        state.sectionQuestions.length - 1;


    await sleep(
        NEXT_QUESTION_DELAY
    );


    /*
     * 2:30がこの処理中に来ていた場合
     *
     * 問題を次へ進めない。
     * 現在の位置をそのまま保持して
     * 区間終了へ進む。
     */
    if (
        state.timeExpired
    ) {

        state.processingAnswer = false;

        finishSection();

        return;

    }


    /*
     * 全問題終了
     */
    if (
        isLastQuestion
    ) {

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

}



/* =========================================================
   START COUNTDOWN
========================================================= */

async function startCountdown() {

    if (
        state.countdownRunning ||
        state.sectionActive ||
        state.sectionFinished ||
        state.finalFinished
    ) {

        return;

    }


    if (
        !state.dataReady ||
        state.sectionQuestions.length === 0
    ) {

        return;

    }


    state.titleScreen = false;

    state.countdownRunning = true;


    DOM.titleOverlay.classList.add(
        "hidden"
    );


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
        let i = 0;
        i < sequence.length;
        i++
    ) {

        if (
            state.sectionFinished
        ) {

            return;

        }


        DOM.countdown.textContent =
            sequence[i];


        /*
         * アニメーションを再起動
         */
        DOM.countdown.style.animation =
            "none";


        void DOM.countdown.offsetWidth;


        DOM.countdown.style.animation =
            "";


        if (
            sequence[i] === "GO!!"
        ) {

            await sleep(500);

        }
        else {

            await sleep(
                COUNTDOWN_STEP
            );

        }

    }


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    state.countdownRunning = false;


    /*
     * 第N区スタート
     */
    startSection();

}



/* =========================================================
   START SECTION
========================================================= */

function startSection() {

    if (
        state.sectionFinished
    ) {

        return;

    }


    state.sectionActive = true;

    state.gameStarted = true;

    state.timeExpired = false;


    document.body.classList.remove(
        "ready"
    );


    state.sectionStartTime =
        performance.now();


    startTimer();

    focusInput();

}



/* =========================================================
   SECTION TIMER
========================================================= */

function startTimer() {

    stopTimer();


    state.sectionStartTime =
        performance.now();


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
        !state.sectionActive ||
        !state.sectionStartTime
    ) {

        return;

    }


    const elapsed =
        performance.now() -
        state.sectionStartTime;


    state.sectionElapsed =
        elapsed;


    /*
     * 表示
     */
    DOM.timer.textContent =
        formatTime(
            elapsed
        );


    /*
     * 2:30
     */
    if (
        elapsed >= PLAYER_TIME &&
        !state.timeExpired
    ) {

        handleTimeExpired();

    }

}



/* =========================================================
   TIME EXPIRED
========================================================= */

function handleTimeExpired() {

    if (
        !state.sectionActive ||
        state.timeExpired
    ) {

        return;

    }


    /*
     * ここが重要。
     *
     * 現在問題番号と現在入力位置を
     * その瞬間のまま保存する。
     */
    state.savedQuestionIndex =
        state.currentQuestionIndex;


    state.savedInputPosition =
        state.currentPosition;


    state.timeExpired = true;


    /*
     * 入力停止
     */
    state.gameStarted = false;


    clearInput();

    clearPressedKeys();


    /*
     * 問題処理中でも、
     * 現在位置を変更しない。
     */
    if (
        state.processingAnswer
    ) {

        return;

    }


    /*
     * 即座に区間終了
     */
    finishSection();

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

        state.timerInterval = null;

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


    stopTimer();


    /*
     * 現在時刻を確定
     */
    if (
        state.sectionStartTime
    ) {

        state.sectionElapsed =
            Math.min(
                performance.now() -
                state.sectionStartTime,
                PLAYER_TIME
            );

    }


    state.sectionActive = false;

    state.gameStarted = false;

    state.countdownRunning = false;

    state.sectionFinished = true;

    state.titleScreen = false;


    clearInput();

    clearPressedKeys();


    /*
     * 2:30で終了した場合は、
     * 保存した位置をstateにも残す。
     */
    if (
        state.timeExpired
    ) {

        state.currentQuestionIndex =
            state.savedQuestionIndex;

        state.currentPosition =
            state.savedInputPosition;


        /*
         * 画面上も「2:30で止まった位置」を
         * そのまま維持する。
         */
        updateRomajiProgress();

        updateRequiredKey();

    }


    DOM.resultSection.textContent =
        String(
            state.currentSection + 1
        );


    DOM.resultTime.textContent =
        formatTime(
            state.sectionElapsed
        );


    DOM.resultScore.textContent =
        String(
            state.score
        );


    DOM.resultMiss.textContent =
        String(
            state.miss
        );


    DOM.titleOverlay.classList.add(
        "hidden"
    );


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    DOM.resultOverlay.classList.remove(
        "hidden"
    );


    updateHUD();

}



/* =========================================================
   NEXT SECTION
========================================================= */

function handleResultNext() {

    if (
        !state.sectionFinished
    ) {

        return;

    }


    /*
     * 現在区間の結果を合計へ加算
     */
    state.totalScore +=
        state.score;


    state.totalMiss +=
        state.miss;


    state.sectionTimes[
        state.currentSection
    ] =
        state.sectionElapsed;


    DOM.resultOverlay.classList.add(
        "hidden"
    );


    /*
     * 次の区間
     */
    const nextSection =
        state.currentSection + 1;


    if (
        nextSection >=
        state.sectionsData.length
    ) {

        finishRace();

        return;

    }


    /*
     * 第N+1区
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
   FINAL
========================================================= */

function finishRace() {

    stopTimer();


    state.sectionActive = false;

    state.gameStarted = false;

    state.sectionFinished = false;

    state.titleScreen = false;

    state.finalFinished = true;


    clearInput();

    clearPressedKeys();


    /*
     * 全区間タイム
     */
    const totalTime =
        state.sectionTimes.reduce(
            (total, time) =>
                total + (
                    Number(time) || 0
                ),
            0
        );


    /*
     * 最終表示
     */
    DOM.finalTime.textContent =
        formatTime(
            totalTime
        );


    DOM.finalScore.textContent =
        String(
            state.totalScore
        );


    DOM.finalMiss.textContent =
        String(
            state.totalMiss
        );


    DOM.finalOverlay.classList.remove(
        "hidden"
    );

}



/* =========================================================
   HUD
========================================================= */

function resetHUD() {

    DOM.score.textContent =
        "0";

    DOM.miss.textContent =
        "0";

    DOM.combo.textContent =
        "0";

    DOM.comboSideValue.textContent =
        "0";

    DOM.accuracy.textContent =
        "100.0%";

}


function updateHUD() {

    DOM.score.textContent =
        String(
            state.score
        );


    DOM.miss.textContent =
        String(
            state.miss
        );


    DOM.combo.textContent =
        String(
            state.combo
        );


    DOM.comboSideValue.textContent =
        String(
            state.combo
        );


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

}



/* =========================================================
   PROGRESS
========================================================= */

function resetProgress() {

    DOM.progressCurrent.textContent =
        "0";


    DOM.progressTotal.textContent =
        String(
            state.sectionTotalChars
        );


    DOM.progressPercent.textContent =
        "0%";


    DOM.progressFill.style.width =
        "0%";

}


function updateProgress() {

    const total =
        state.sectionTotalChars;


    const current =
        state.sectionCharsTyped;


    const percent =
        total > 0
            ? Math.min(
                100,
                (
                    current /
                    total
                ) * 100
            )
            : 0;


    DOM.progressCurrent.textContent =
        String(
            current
        );


    DOM.progressTotal.textContent =
        String(
            total
        );


    DOM.progressPercent.textContent =
        `${percent.toFixed(0)}%`;


    DOM.progressFill.style.width =
        `${percent}%`;


    /*
     * キャラクター位置
     */
    const runnerPercent =
        Math.min(
            92,
            2 + (
                percent *
                .9
            )
        );


    DOM.runner.style.left =
        `${runnerPercent}%`;

}



/* =========================================================
   SECTION NUMBER
========================================================= */

function updateSectionNumber() {

    DOM.sectionNumber.textContent =
        String(
            state.currentSection + 1
        );

}



/* =========================================================
   RUNNER
========================================================= */

function resetRunner() {

    DOM.runner.style.left =
        "2%";

}



/* =========================================================
   REQUIRED KEY
========================================================= */

function updateRequiredKey() {

    clearCurrentKeys();


    if (
        !state.currentAnswer ||
        state.currentPosition >=
        state.currentAnswer.length
    ) {

        return;

    }


    const required =
        state.currentAnswer[
            state.currentPosition
        ];


    DOM.keys.forEach(key => {

        if (
            key.dataset.key ===
            required
        ) {

            key.classList.add(
                "current"
            );

        }

    });

}



/* =========================================================
   KEY EFFECT
========================================================= */

function flashPressedKey(keyValue) {

    let target = null;


    DOM.keys.forEach(key => {

        if (
            key.dataset.key ===
            keyValue
        ) {

            target = key;

        }

    });


    if (!target) {

        return;

    }


    target.classList.add(
        "pressed"
    );


    setTimeout(
        () => {

            target.classList.remove(
                "pressed"
            );

        },
        100
    );

}


function clearCurrentKeys() {

    DOM.keys.forEach(key => {

        key.classList.remove(
            "current"
        );

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
   EFFECT
========================================================= */

function flashEffect(element) {

    element.classList.remove(
        "show"
    );


    void element.offsetWidth;


    element.classList.add(
        "show"
    );


    setTimeout(
        () => {

            element.classList.remove(
                "show"
            );

        },
        600
    );

}



/* =========================================================
   INPUT
========================================================= */

function clearInput() {

    DOM.typingInput.value =
        "";

}


function focusInput() {

    if (
        state.finalFinished
    ) {

        return;

    }


    try {

        DOM.typingInput.focus({
            preventScroll: true
        });

    }
    catch {

        DOM.typingInput.focus();

    }

}



/* =========================================================
   OVERLAY
========================================================= */

function hideAllOverlays() {

    DOM.titleOverlay.classList.add(
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

    console.error(
        "[KIR ERROR]",
        message
    );


    /*
     * DOM初期化前でもエラーで
     * 二次エラーを起こさない。
     */
    const errorMessage =
        document.getElementById(
            "error-message"
        );


    const errorOverlay =
        document.getElementById(
            "error-overlay"
        );


    if (errorMessage) {

        errorMessage.textContent =
            String(message);

    }


    if (errorOverlay) {

        errorOverlay.classList.remove(
            "hidden"
        );

    }

}



/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(milliseconds) {

    const safe =
        Math.max(
            0,
            Number(milliseconds) || 0
        );


    const minutes =
        Math.floor(
            safe / 60000
        );


    const seconds =
        Math.floor(
            (safe % 60000) / 1000
        );


    const millis =
        Math.floor(
            safe % 1000
        );


    return (

        String(minutes)
            .padStart(2, "0")

        + ":" +

        String(seconds)
            .padStart(2, "0")

        + "." +

        String(millis)
            .padStart(3, "0")

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

    state,

    restart() {

        location.reload();

    },

    start() {

        if (
            state.titleScreen &&
            state.dataReady
        ) {

            startCountdown();

        }

    },

    finishSection() {

        finishSection();

    }

};