/* =========================================================
   KIR RECREATION TOURNAMENT 2026
   めちゃむずキーボード早打ち駅伝

   game.js 完全版

   CSV仕様:
   question_no,section,genre,display,answer

   display = 画面表示
   answer  = 実際の入力判定

   1人 = 1区間
   1区間 = 2分30秒
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const GAME_ID = "KIR-KAI-2026";


/*
 * 使用可能チーム
 */
const VALID_TEAMS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
];


/*
 * 区間CSV
 *
 * 現在の仕様では5区間。
 *
 * もし6区間に戻す場合は
 * 下に "data/section6.csv" を追加する。
 */
const SECTION_FILES = [
    "data/section1.csv",
    "data/section2.csv",
    "data/section3.csv",
    "data/section4.csv",
    "data/section5.csv",
    "data/section6.csv"    
];


/*
 * 1区間の制限時間
 *
 * 2分30秒
 */
const SECTION_TIME = 150000;


/*
 * カウントダウン
 */
const COUNTDOWN_TIME = 1000;


/*
 * 問題切り替えの待ち時間
 */
const NEXT_QUESTION_DELAY = 150;


/*
 * 区間終了後の待ち時間
 */
const NEXT_SECTION_DELAY = 300;


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

    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    sectionNumber:
        $("section-number"),

    teamName:
        $("team-name"),

    timer:
        $("timer"),


    /* -----------------------------------------------------
       RUNNER
    ----------------------------------------------------- */

    runner:
        $("runner"),

    runnerImage:
        $("runner-image"),

    finishFlag:
        $("finish-flag"),


    /* -----------------------------------------------------
       QUESTION
    ----------------------------------------------------- */

    questionNumber:
        $("question-number"),

    questionGenre:
        $("question-genre"),

    questionText:
        $("question-text"),

    romajiProgress:
        $("romaji-progress"),


    /* -----------------------------------------------------
       NEXT KEY
    ----------------------------------------------------- */

    nextKey:
        $("next-key"),

    nextKeyCombo:
        $("next-key-combo"),


    /* -----------------------------------------------------
       SCORE
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       PROGRESS
    ----------------------------------------------------- */

    progressPercent:
        $("progress-percent"),

    progressFill:
        $("progress-fill"),

    progressCurrent:
        $("progress-current"),

    progressTotal:
        $("progress-total"),


    /* -----------------------------------------------------
       EFFECT
    ----------------------------------------------------- */

    goodEffect:
        $("good-effect"),

    missEffect:
        $("miss-effect"),

    boostEffect:
        $("boost-effect"),


    /* -----------------------------------------------------
       COUNTDOWN
    ----------------------------------------------------- */

    countdownOverlay:
        $("countdown-overlay"),

    countdown:
        $("countdown"),


    /* -----------------------------------------------------
       TITLE
    ----------------------------------------------------- */

    titleOverlay:
        $("title-overlay"),

    titleSection:
        $("title-section"),

    titlePressEnter:
        $("title-press-enter"),


    /* -----------------------------------------------------
       ERROR
    ----------------------------------------------------- */

    errorOverlay:
        $("error-overlay"),

    errorMessage:
        $("error-message"),

    errorReloadButton:
        $("error-reload-button"),


    /* -----------------------------------------------------
       RESULT
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       FINAL
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       INPUT
    ----------------------------------------------------- */

    typingInput:
        $("typing-input"),


    /* -----------------------------------------------------
       TEAM BUTTON
    ----------------------------------------------------- */

    teamButtons:
        document.querySelectorAll(
            ".team-select"
        ),


    /* -----------------------------------------------------
       OLD VIRTUAL KEYBOARD
       互換用
    ----------------------------------------------------- */

    keys:
        document.querySelectorAll(
            ".key"
        )

};


/* =========================================================
   STATE
========================================================= */

const state = {

    /* -----------------------------------------------------
       SYSTEM
    ----------------------------------------------------- */

    initialized:
        false,

    dataReady:
        false,


    /* -----------------------------------------------------
       TEAM
    ----------------------------------------------------- */

    team:
        "A",


    /* -----------------------------------------------------
       CSV DATA
    ----------------------------------------------------- */

    sectionsData:
        [],


    /* -----------------------------------------------------
       CURRENT SECTION
    ----------------------------------------------------- */

    currentSection:
        0,

    sectionQuestions:
        [],


    /* -----------------------------------------------------
       CURRENT QUESTION
    ----------------------------------------------------- */

    currentQuestionIndex:
        0,

    currentAnswer:
        "",

    currentPosition:
        0,


    /* -----------------------------------------------------
       SECTION SCORE
    ----------------------------------------------------- */

    score:
        0,

    miss:
        0,

    combo:
        0,


    /* -----------------------------------------------------
       TOTAL SCORE
    ----------------------------------------------------- */

    totalScore:
        0,

    totalMiss:
        0,


    /* -----------------------------------------------------
       PROGRESS
    ----------------------------------------------------- */

    sectionTotalChars:
        0,

    sectionCharsTyped:
        0,


    /* -----------------------------------------------------
       TIMER
    ----------------------------------------------------- */

    sectionStartTime:
        0,

    sectionElapsed:
        0,

    timerInterval:
        null,


    /* -----------------------------------------------------
       GAME STATUS
    ----------------------------------------------------- */

    sectionActive:
        false,

    gameStarted:
        false,

    sectionFinished:
        false,

    titleScreen:
        true,

    countdownRunning:
        false,

    processingAnswer:
        false,

    timeExpired:
        false,

    finalFinished:
        false,


    /* -----------------------------------------------------
       TIME LIMIT POSITION
    ----------------------------------------------------- */

    savedQuestionIndex:
        0,

    savedInputPosition:
        0,


    /* -----------------------------------------------------
       SECTION TIMES
    ----------------------------------------------------- */

    sectionTimes:
        []

};


/* =========================================================
   DOM CHECK
========================================================= */

function checkDOM() {

    const required = [

        "section-number",
        "team-name",
        "timer",

        "runner",
        "runner-image",

        "question-number",
        "question-genre",
        "question-text",
        "romaji-progress",

        "next-key",
        "next-key-combo",

        "score",
        "miss",
        "combo",
        "combo-side-value",
        "accuracy",

        "progress-percent",
        "progress-fill",
        "progress-current",
        "progress-total",

        "good-effect",
        "miss-effect",
        "boost-effect",

        "countdown-overlay",
        "countdown",

        "title-overlay",
        "title-section",
        "title-press-enter",

        "error-overlay",
        "error-message",
        "error-reload-button",

        "result-overlay",
        "result-section",
        "result-time",
        "result-score",
        "result-miss",
        "result-next-button",

        "final-overlay",
        "final-time",
        "final-score",
        "final-miss",
        "restart-button",

        "typing-input"

    ];


    const missing = [];


    required.forEach(id => {

        if (!$(id)) {

            missing.push(id);

        }

    });


    if (missing.length > 0) {

        throw new Error(
            "HTML要素が見つかりません:\n\n" +
            missing.join("\n")
        );

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    try {

        // DOM要素の存在チェック
        checkDOM();

        // 各種イベントリスナーの登録
        bindEvents();

        // URLパラメータからチーム情報を取得
        readTeamFromURL();

        // 取得したチーム情報を画面に反映
        applyTeam();

        // ゲーム状態の全体リセット
        resetWholeGame();

        // 全区間のCSVデータをロード
        await loadAllSections();

        state.initialized = true;

        console.log(
            `[${GAME_ID}] initialized`
        );

    }
    catch (error) {

        console.error(error);

        // エラー発生時にオーバーレイ画面を表示
        showError(
            error instanceof Error
                ? error.message
                : String(error)
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
     * チーム選択
     */
    DOM.teamButtons.forEach(
        button => {

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
                        String(
                            button.dataset.team || ""
                        ).toUpperCase();


                    if (
                        VALID_TEAMS.includes(team)
                    ) {

                        state.team = team;

                        applyTeam();

                    }

                }
            );

        }
    );


    /*
     * 区間結果 → 次へ
     */
    DOM.resultNextButton.addEventListener(
        "click",
        handleResultNext
    );


    /*
     * 最終結果 → リスタート
     */
    DOM.restartButton.addEventListener(
        "click",
        () => {

            location.reload();

        }
    );


    /*
     * エラー → リロード
     */
    DOM.errorReloadButton.addEventListener(
        "click",
        () => {

            location.reload();

        }
    );


    /*
     * 古い仮想キーボード
     *
     * 実際の入力判定には使用しない。
     */
    DOM.keys.forEach(
        key => {

            key.addEventListener(
                "mousedown",
                event => {

                    event.preventDefault();

                }
            );

        }
    );


    /*
     * ブラウザからフォーカスが外れたら
     * キー発光だけ解除
     */
    window.addEventListener(
        "blur",
        clearPressedKeys
    );

}


/* =========================================================
   KEYDOWN
========================================================= */

function handleKeyDown(event) {

    /*
     * Ctrl / Alt / Meta
     */
    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {

        return;

    }


    /* -----------------------------------------------------
       FINAL
    ----------------------------------------------------- */

    if (
        event.key === "Enter" &&
        state.finalFinished
    ) {

        event.preventDefault();

        location.reload();

        return;

    }


    /* -----------------------------------------------------
       TITLE
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       RESULT
    ----------------------------------------------------- */

    if (
        event.key === "Enter" &&
        state.sectionFinished
    ) {

        event.preventDefault();

        handleResultNext();

        return;

    }


    /* -----------------------------------------------------
       GAME ACTIVE CHECK
    ----------------------------------------------------- */

    if (
        !state.gameStarted ||
        !state.sectionActive ||
        state.countdownRunning ||
        state.sectionFinished ||
        state.finalFinished
    ) {

        return;

    }


    /* -----------------------------------------------------
       ENTER
    ----------------------------------------------------- */

    if (
        event.key === "Enter"
    ) {

        event.preventDefault();

        return;

    }


    /* -----------------------------------------------------
       SHIFT
    ----------------------------------------------------- */

    if (
        event.key === "Shift"
    ) {

        return;

    }


    /* -----------------------------------------------------
       CHARACTER
    ----------------------------------------------------- */

    const key =
        normalizeKey(
            event.key
        );


    if (!key) {

        return;

    }


    /*
     * 1文字だけ
     */
    if (
        key.length !== 1
    ) {

        return;

    }


    event.preventDefault();


    flashPressedKey(key);

    checkCharacter(key);

}


/* =========================================================
   NORMALIZE KEY
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
   TEAM FROM URL
========================================================= */

function readTeamFromURL() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
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
    catch (error) {

        console.warn(
            "URLからチームを取得できません:",
            error
        );

        state.team = "A";

    }

}


function applyTeam() {

    // 表示名（色名）に変換するテーブル
    const TEAM_DISPLAY_NAME = {
        A: "TEAM BLUE",
        B: "TEAM RED",
        C: "TEAM GREEN",
        D: "TEAM YELLOW",
        E: "TEAM PURPLE",
        F: "TEAM SKYBLUE"
    };

    // UIカラー（--cyan をチーム色に変更）
    const TEAM_UI_COLOR = {
        A: "#00aaff",   // BLUE
        B: "#ff3333",   // RED
        C: "#33cc33",   // GREEN
        D: "#ffdd00",   // YELLOW
        E: "#aa33ff",   // PURPLE
        F: "#33ddff"    // SKYBLUE
    };

    // CSS変数を書き換え（UI全体の光・枠線・HUDが変わる）
    document.documentElement.style.setProperty(
        "--cyan",
        TEAM_UI_COLOR[state.team]
    );

    // TEAM名表示（色名）
    DOM.teamName.textContent = TEAM_DISPLAY_NAME[state.team];

    // TEAM名の色クラス切り替え
    DOM.teamName.classList.remove(
        "team-A", "team-B", "team-C",
        "team-D", "team-E", "team-F"
    );
    DOM.teamName.classList.add(`team-${state.team}`);

    // タイトルの色クラス切り替え + 文言変更
    const mainTitle = document.querySelector(".main-title");
    if (mainTitle) {

        mainTitle.classList.remove(
            "title-A", "title-B", "title-C",
            "title-D", "title-E", "title-F"
        );
        mainTitle.classList.add(`title-${state.team}`);

        // タイトル文言を色名に変更
        mainTitle.innerHTML =
            `めちゃむずキーボード早打ち<span>駅伝</span> - ${TEAM_DISPLAY_NAME[state.team]}`;
    }

    // runner画像切り替え
    DOM.runnerImage.src = `img/character/${state.team}team.png`;
    DOM.runnerImage.alt = TEAM_DISPLAY_NAME[state.team];

    // TEAMボタンの active 切り替え
    DOM.teamButtons.forEach(button => {
        button.classList.toggle(
            "active",
            String(button.dataset.team).toUpperCase() === state.team
        );
    });
}

/* =========================================================
   RESET WHOLE GAME
========================================================= */

function resetWholeGame() {

    stopTimer();


    state.currentSection =
        0;


    state.sectionQuestions =
        [];


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


    state.totalScore =
        0;


    state.totalMiss =
        0;


    state.sectionTotalChars =
        0;


    state.sectionCharsTyped =
        0;


    state.sectionStartTime =
        0;


    state.sectionElapsed =
        0;


    state.sectionTimes =
        [];


    state.sectionActive =
        false;


    state.gameStarted =
        false;


    state.sectionFinished =
        false;


    state.titleScreen =
        true;


    state.countdownRunning =
        false;


    state.processingAnswer =
        false;


    state.timeExpired =
        false;


    state.finalFinished =
        false;


    state.savedQuestionIndex =
        0;


    state.savedInputPosition =
        0;


    hideAllOverlays();


    document.body.classList.add(
        "ready"
    );


    updateSectionNumber();

    resetHUD();

    resetProgress();

    resetRunner();

    resetQuestionUI();

    resetTimer();


    focusInput();

}


/* =========================================================
   RESET TIMER
========================================================= */

function resetTimer() {

    DOM.timer.textContent =
        "00:00.000";

}


/* =========================================================
   RESET QUESTION UI
========================================================= */

function resetQuestionUI() {

    DOM.questionNumber.textContent =
        "0 / 0";


    DOM.questionGenre.textContent =
        "---";


    DOM.questionText.textContent =
        "LOADING...";


    DOM.romajiProgress.textContent =
        "";


    DOM.nextKey.textContent =
        "—";


    DOM.nextKeyCombo.textContent =
        "—";

}


/* =========================================================
   LOAD ALL SECTIONS
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


            console.log(
                `[KIR CSV] loading: ${file}`
            );


            const response =
                await fetch(
                    `${file}?v=${Date.now()}`
                );


            if (!response.ok) {

                throw new Error(
                    `CSV読み込み失敗\n\n` +
                    `ファイル: ${file}\n` +
                    `HTTP: ${response.status}`
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
                    `${file}\n\n` +
                    "有効な問題がありません。"
                );

            }


            loadedSections.push(
                questions
            );


            console.log(
                `[KIR CSV] ${file}: ${questions.length}問`
            );

        }


        state.sectionsData =
            loadedSections;


        state.dataReady =
            true;


        /*
         * 第1区を準備
         */
        prepareSection(0);


        /*
         * タイトル表示
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

    /*
     * BOM除去
     */
    text =
        String(text || "")
            .replace(
                /^\uFEFF/,
                ""
            );


    /*
     * 改行コード統一
     */
    text =
        text
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            );


    /*
     * CSV行
     */
    const rows = [];


    let row = [];

    let cell = "";

    let inQuotes = false;


    /*
     * CSV解析
     */
    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


        const next =
            text[i + 1];


        /*
         * エスケープされた "
         *
         * ""
         */
        if (
            char === '"' &&
            inQuotes &&
            next === '"'
        ) {

            cell += '"';

            i++;

            continue;

        }


        /*
         * クォート開始 / 終了
         */
        if (
            char === '"'
        ) {

            inQuotes =
                !inQuotes;

            continue;

        }


        /*
         * カンマ
         */
        if (
            char === "," &&
            !inQuotes
        ) {

            row.push(cell);

            cell = "";

            continue;

        }


        /*
         * 改行
         */
        if (
            char === "\n" &&
            !inQuotes
        ) {

            row.push(cell);

            cell = "";


            /*
             * 完全空行は除外
             */
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


    /*
     * 最後のセル
     */
    row.push(cell);


    /*
     * 最終行
     */
    if (
        row.some(
            value =>
                String(value).trim() !== ""
        )
    ) {

        rows.push(row);

    }


    /*
     * データがない
     */
    if (
        rows.length < 2
    ) {

        throw new Error(
            "CSVにデータがありません。"
        );

    }


    /* =====================================================
       HEADER
    ===================================================== */

    const headers =
        rows[0].map(
            value => {

                return String(value)
                    .replace(
                        /^\uFEFF/,
                        ""
                    )
                    .trim()
                    .toLowerCase();

            }
        );


    console.log(
        "[KIR CSV HEADER]",
        headers
    );


    /*
     * 必須ヘッダー
     */
    const requiredHeaders = [

        "question_no",
        "section",
        "genre",
        "display",
        "answer"

    ];


    /*
     * 足りないヘッダー
     */
    const missingHeaders =
        requiredHeaders.filter(
            header =>
                !headers.includes(header)
        );


    if (
        missingHeaders.length > 0
    ) {

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


    /*
     * 列番号
     */
    const questionNoIndex =
        headers.indexOf(
            "question_no"
        );


    const sectionIndex =
        headers.indexOf(
            "section"
        );


    const genreIndex =
        headers.indexOf(
            "genre"
        );


    const displayIndex =
        headers.indexOf(
            "display"
        );


    const answerIndex =
        headers.indexOf(
            "answer"
        );


    /* =====================================================
       DATA
    ===================================================== */

    const result = [];


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const currentRow =
            rows[i];


        /*
         * 空行
         */
        if (
            currentRow.length === 0
        ) {

            continue;

        }


        /*
         * 各列
         */
        const questionNo =
            String(
                currentRow[
                    questionNoIndex
                ] ?? ""
            )
                .trim();


        const section =
            String(
                currentRow[
                    sectionIndex
                ] ?? ""
            )
                .trim();


        const genre =
            decodeSpecialSpaces(
                String(
                    currentRow[
                        genreIndex
                    ] ?? ""
                )
                    .trim()
            );


        const display =
            decodeSpecialSpaces(
                String(
                    currentRow[
                        displayIndex
                    ] ?? ""
                )
                    .trim()
            );


        const answer =
            decodeSpecialSpaces(
                String(
                    currentRow[
                        answerIndex
                    ] ?? ""
                )
                    .trim()
            )
                .toLowerCase();


        /*
         * 完全空行
         */
        if (
            !questionNo &&
            !section &&
            !genre &&
            !display &&
            !answer
        ) {

            continue;

        }


        /*
         * answerなし
         */
        if (
            !answer
        ) {

            console.warn(
                `[KIR CSV] ${i + 1}行目: answerが空`
            );

            continue;

        }


        /*
         * 問題追加
         */
        result.push({

            questionNo:
                questionNo ||
                String(i),

            section:
                section,

            genre:
                genre,

            display:
                display,

            answer:
                answer

        });

    }


    /*
     * 有効問題なし
     */
    if (
        result.length === 0
    ) {

        throw new Error(
            "CSVから有効な問題を読み込めませんでした。"
        );

    }


    console.log(
        `[KIR CSV] ${result.length}問読み込み完了`
    );


    return result;

}


/* =========================================================
   SPECIAL SPACE
========================================================= */

function decodeSpecialSpaces(value) {

    return String(value)

        /*
         * 半角スペース
         */
        .replace(
            /\[半角スペース\]/g,
            " "
        )

        /*
         * 全角スペース
         */
        .replace(
            /\[全角スペース\]/g,
            " "
        );

}


/* =========================================================
   PREPARE SECTION
========================================================= */

function prepareSection(
    sectionIndex
) {

    /*
     * タイマー停止
     */
    stopTimer();


    /*
     * 全区間終了
     */
    if (
        sectionIndex < 0 ||
        sectionIndex >=
        state.sectionsData.length
    ) {

        finishRace();

        return;

    }


    /*
     * 区間設定
     */
    state.currentSection =
        sectionIndex;


    state.sectionQuestions =
        state.sectionsData[
            sectionIndex
        ];


    /*
     * 問題
     */
    state.currentQuestionIndex =
        0;


    state.currentAnswer =
        "";


    state.currentPosition =
        0;


    /*
     * スコア
     */
    state.score =
        0;


    state.miss =
        0;


    state.combo =
        0;


    /*
     * 文字数
     */
    state.sectionCharsTyped =
        0;


    state.sectionTotalChars =
        state.sectionQuestions.reduce(
            (
                total,
                question
            ) => {

                return total +
                    question.answer.length;

            },
            0
        );


    /*
     * タイマー
     */
    state.sectionStartTime =
        0;


    state.sectionElapsed =
        0;


    /*
     * 状態
     */
    state.sectionActive =
        false;


    state.gameStarted =
        false;


    state.sectionFinished =
        false;


    state.titleScreen =
        true;


    state.countdownRunning =
        false;


    state.processingAnswer =
        false;


    state.timeExpired =
        false;


    /*
     * 保存位置
     */
    state.savedQuestionIndex =
        0;


    state.savedInputPosition =
        0;


    /*
     * 入力
     */
    clearInput();

    clearPressedKeys();


    /*
     * UI
     */
    updateSectionNumber();

    resetHUD();

    resetProgress();

    resetRunner();

    resetTimer();

    showQuestion();


    /*
     * タイトル
     */
    showSectionTitle();

}


/* =========================================================
   SHOW SECTION TITLE
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


    DOM.resultOverlay.classList.add(
        "hidden"
    );


    state.titleScreen =
        true;


    document.body.classList.add(
        "ready"
    );


    focusInput();

}


/* =========================================================
   SHOW QUESTION
========================================================= */

function showQuestion() {

    const question =
        state.sectionQuestions[
            state.currentQuestionIndex
        ];


    /*
     * 問題終了
     */
    if (!question) {

        finishSection();

        return;

    }


    /*
     * ==============================================
     * genre
     * ==============================================
     */
    DOM.questionGenre.textContent =
        question.genre || "---";


    /*
     * ==============================================
     * display
     *
     * 画面に表示するお題
     * ==============================================
     */
    DOM.questionText.textContent =
        question.display;


    /*
     * ==============================================
     * answer
     *
     * 実際に入力する文字列
     * ==============================================
     */
    state.currentAnswer =
        String(
            question.answer || ""
        )
            .toLowerCase();


    /*
     * 新しい問題なので
     * 入力位置は0
     */
    state.currentPosition =
        0;


    /*
     * 問題番号
     */
    DOM.questionNumber.textContent =
        `${state.currentQuestionIndex + 1} / ${state.sectionQuestions.length}`;


    /*
     * 表示更新
     */
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


    /*
     * 空
     */
    if (!answer) {

        DOM.romajiProgress.textContent =
            "";

        return;

    }


    /*
     * 初期化
     */
    DOM.romajiProgress.innerHTML =
        "";


    const fragment =
        document.createDocumentFragment();


    /*
     * 1文字ずつ表示
     */
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


        /*
         * 入力済み
         */
        if (
            i < position
        ) {

            span.className =
                "typed";

        }

        /*
         * 現在位置
         */
        else if (
            i === position
        ) {

            span.className =
                "current";

        }

        /*
         * 未入力
         */
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

function checkCharacter(
    input
) {

    /*
     * 処理中
     */
    if (
        state.processingAnswer
    ) {

        return;

    }


    /*
     * ゲーム状態
     */
    if (
        !state.gameStarted ||
        !state.sectionActive
    ) {

        return;

    }


    /*
     * 期待文字
     */
    const expected =
        state.currentAnswer[
            state.currentPosition
        ];


    /*
     * 終端
     */
    if (!expected) {

        return;

    }


    /*
     * 正解
     */
    if (
        input === expected
    ) {

        handleCorrect();

    }

    /*
     * MISS
     */
    else {

        handleMiss();

    }

}


/* =========================================================
   CORRECT
========================================================= */

function handleCorrect() {

    /*
     * 入力位置
     */
    state.currentPosition++;


    /*
     * 入力済み文字数
     */
    state.sectionCharsTyped++;


    /*
     * COMBO
     */
    state.combo++;


    /*
     * 基本スコア
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


    /*
     * GOOD
     */
    flashEffect(
        DOM.goodEffect
    );


    /*
     * 10コンボごと
     */
    if (
        state.combo > 0 &&
        state.combo % 10 === 0
    ) {

        flashEffect(
            DOM.boostEffect
        );

    }


    /*
     * UI
     */
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

    /*
     * MISS
     */
    state.miss++;


    /*
     * COMBOリセット
     */
    state.combo =
        0;


    /*
     * MISS演出
     */
    flashEffect(
        DOM.missEffect
    );


    /*
     * UI
     */
    updateHUD();

}


/* =========================================================
   COMPLETE QUESTION
========================================================= */

async function completeQuestion() {

    /*
     * 二重実行防止
     */
    if (
        state.processingAnswer
    ) {

        return;

    }


    state.processingAnswer =
        true;


    /*
     * 最終問題か
     */
    const isLastQuestion =
        state.currentQuestionIndex >=
        state.sectionQuestions.length - 1;


    /*
     * 少しだけ演出
     */
    await sleep(
        NEXT_QUESTION_DELAY
    );


    /*
     * この間に2:30になった場合
     *
     * ★現在位置を変更しない
     */
    if (
        state.timeExpired
    ) {

        state.processingAnswer =
            false;


        finishSection();

        return;

    }


    /*
     * 全問題終了
     */
    if (
        isLastQuestion
    ) {

        state.processingAnswer =
            false;


        finishSection();

        return;

    }


    /*
     * 次の問題
     */
    state.currentQuestionIndex++;


    state.processingAnswer =
        false;


    showQuestion();

}


/* =========================================================
   COUNTDOWN
========================================================= */

async function startCountdown() {

    /*
     * 二重起動防止
     */
    if (
        state.countdownRunning ||
        state.sectionActive ||
        state.sectionFinished ||
        state.finalFinished
    ) {

        return;

    }


    /*
     * データ確認
     */
    if (
        !state.dataReady ||
        state.sectionQuestions.length === 0
    ) {

        return;

    }


    /*
     * タイトル終了
     */
    state.titleScreen =
        false;


    state.countdownRunning =
        true;


    DOM.titleOverlay.classList.add(
        "hidden"
    );


    DOM.countdownOverlay.classList.remove(
        "hidden"
    );


    /*
     * 3 → 2 → 1 → GO
     */
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

        /*
         * 中断
         */
        if (
            state.sectionFinished
        ) {

            state.countdownRunning =
                false;

            return;

        }


        DOM.countdown.textContent =
            sequence[i];


        /*
         * アニメーション再起動
         */
        DOM.countdown.style.animation =
            "none";


        void DOM.countdown.offsetWidth;


        DOM.countdown.style.animation =
            "";


        /*
         * GOだけ短く
         */
        if (
            sequence[i] === "GO!!"
        ) {

            await sleep(500);

        }
        else {

            await sleep(
                COUNTDOWN_TIME
            );

        }

    }


    /*
     * カウントダウン終了
     */
    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    state.countdownRunning =
        false;


    /*
     * 区間スタート
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


    /*
     * 状態
     */
    state.sectionActive =
        true;


    state.gameStarted =
        true;


    state.timeExpired =
        false;


    document.body.classList.remove(
        "ready"
    );


    /*
     * 開始時刻
     */
    state.sectionStartTime =
        performance.now();


    /*
     * タイマー
     */
    startTimer();


    /*
     * 入力フォーカス
     */
    focusInput();

}


/* =========================================================
   START TIMER
========================================================= */

function startTimer() {

    stopTimer();


    state.sectionStartTime =
        performance.now();


    state.sectionElapsed =
        0;


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

    /*
     * 非アクティブ
     */
    if (
        !state.sectionActive ||
        !state.sectionStartTime
    ) {

        return;

    }


    /*
     * 経過時間
     */
    const elapsed =
        performance.now() -
        state.sectionStartTime;


    state.sectionElapsed =
        elapsed;


    /*
     * 画面表示
     */
    DOM.timer.textContent =
        formatTime(
            elapsed
        );


    /*
     * 2分30秒
     */
    if (
        elapsed >= SECTION_TIME &&
        !state.timeExpired
    ) {

        handleTimeExpired();

    }

}


/* =========================================================
   TIME EXPIRED
========================================================= */

function handleTimeExpired() {

    /*
     * 二重実行防止
     */
    if (
        !state.sectionActive ||
        state.timeExpired
    ) {

        return;

    }


    /*
     * ==============================================
     * ★重要
     *
     * 2:30になった瞬間の位置を保存
     *
     * currentQuestionIndex
     * currentPosition
     *
     * をそのまま保存する。
     * ==============================================
     */

    state.savedQuestionIndex =
        state.currentQuestionIndex;


    state.savedInputPosition =
        state.currentPosition;


    /*
     * 時間切れ
     */
    state.timeExpired =
        true;


    /*
     * 入力停止
     */
    state.gameStarted =
        false;


    /*
     * 入力欄クリア
     */
    clearInput();


    /*
     * キー発光解除
     */
    clearPressedKeys();


    /*
     * 問題完了処理中なら
     *
     * completeQuestion() 側で
     * finishSection() する。
     */
    if (
        state.processingAnswer
    ) {

        return;

    }


    /*
     * 即時区間終了
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


        state.timerInterval =
            null;

    }

}


/* =========================================================
   FINISH SECTION
========================================================= */

function finishSection() {

    /*
     * 二重実行防止
     */
    if (
        state.sectionFinished
    ) {

        return;

    }


    /*
     * タイマー停止
     */
    stopTimer();


    /*
     * 最終経過時間
     */
    if (
        state.sectionStartTime
    ) {

        state.sectionElapsed =
            Math.min(
                performance.now() -
                state.sectionStartTime,
                SECTION_TIME
            );

    }


    /*
     * 状態停止
     */
    state.sectionActive =
        false;


    state.gameStarted =
        false;


    state.countdownRunning =
        false;


    state.sectionFinished =
        true;


    state.titleScreen =
        false;


    /*
     * 入力停止
     */
    clearInput();

    clearPressedKeys();


    /*
     * ==============================================
     * 2:30終了の場合
     *
     * 保存していた
     *
     * 問題番号
     * 入力位置
     *
     * に戻す。
     *
     * ★「次の問題」へ勝手に進めない。
     * ==============================================
     */

    if (
        state.timeExpired
    ) {

        state.currentQuestionIndex =
            state.savedQuestionIndex;


        state.currentPosition =
            state.savedInputPosition;


        updateRomajiProgress();

        updateRequiredKey();

    }


    /*
     * 区間結果
     */
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


    /*
     * オーバーレイ
     */
    DOM.titleOverlay.classList.add(
        "hidden"
    );


    DOM.countdownOverlay.classList.add(
        "hidden"
    );


    DOM.resultOverlay.classList.remove(
        "hidden"
    );


    /*
     * HUD
     */
    updateHUD();

}


/* =========================================================
   RESULT → NEXT SECTION
========================================================= */

function handleResultNext() {

    /*
     * 区間終了していなければ無視
     */
    if (
        !state.sectionFinished
    ) {

        return;

    }


    /*
     * 現在区間を合計
     */
    state.totalScore +=
        state.score;


    state.totalMiss +=
        state.miss;


    state.sectionTimes[
        state.currentSection
    ] =
        state.sectionElapsed;


    /*
     * 結果画面を閉じる
     */
    DOM.resultOverlay.classList.add(
        "hidden"
    );


    /*
     * 次の区間
     */
    const nextSection =
        state.currentSection + 1;


    /*
     * 全区間終了
     */
    if (
        nextSection >=
        state.sectionsData.length
    ) {

        finishRace();

        return;

    }


    /*
     * 少し待って次区間
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
   FINISH RACE
========================================================= */

function finishRace() {

    /*
     * タイマー停止
     */
    stopTimer();


    /*
     * 状態
     */
    state.sectionActive =
        false;


    state.gameStarted =
        false;


    state.sectionFinished =
        false;


    state.titleScreen =
        false;


    state.finalFinished =
        true;


    /*
     * 入力
     */
    clearInput();

    clearPressedKeys();


    /*
     * 合計タイム
     */
    const totalTime =
        state.sectionTimes.reduce(
            (
                total,
                time
            ) => {

                return total +
                    (
                        Number(time) || 0
                    );

            },
            0
        );


    /*
     * 最終結果
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


    /*
     * 表示
     */
    DOM.finalOverlay.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HUD RESET
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


/* =========================================================
   HUD UPDATE
========================================================= */

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


    /*
     * 正確率
     *
     * 正解文字数 /
     * (正解文字数 + MISS)
     */
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
   PROGRESS RESET
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


/* =========================================================
   PROGRESS UPDATE
========================================================= */

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


    /*
     * 数値
     */
    DOM.progressCurrent.textContent =
        String(
            current
        );


    DOM.progressTotal.textContent =
        String(
            total
        );


    /*
     * %
     */
    DOM.progressPercent.textContent =
        `${percent.toFixed(0)}%`;


    /*
     * バー
     */
    DOM.progressFill.style.width =
        `${percent}%`;


    /*
     * ランナー
     */
    const runnerPercent =
        Math.min(
            92,
            2 + (
                percent * 0.9
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
   RUNNER RESET
========================================================= */

function resetRunner() {

    DOM.runner.style.left =
        "2%";

}


/* =========================================================
   NEXT KEY
========================================================= */

function updateRequiredKey() {

    /*
     * 旧キーボードの
     * current状態を全部解除
     */
    clearCurrentKeys();


    /*
     * 入力完了
     */
    if (
        !state.currentAnswer ||
        state.currentPosition >=
        state.currentAnswer.length
    ) {

        DOM.nextKey.textContent =
            "✓";


        DOM.nextKeyCombo.textContent =
            "COMPLETE";


        return;

    }


    /*
     * 次の1文字
     */
    const required =
        state.currentAnswer[
            state.currentPosition
        ];


    /*
     * NEXT KEY
     */
    DOM.nextKey.textContent =
        required;


    /*
     * キー操作
     */
    DOM.nextKeyCombo.textContent =
        getKeyGuide(
            required
        );


    /*
     * 旧仮想キーボード
     */
    DOM.keys.forEach(
        key => {

            if (
                String(
                    key.dataset.key || ""
                ).toLowerCase() ===
                required
            ) {

                key.classList.add(
                    "current"
                );

            }

        }
    );

}


/* =========================================================
   KEY GUIDE
========================================================= */

function getKeyGuide(
    character
) {

    const map = {

        " ":
            "SPACE",

        "!":
            "Shift + 1",

        '"':
            "Shift + 2",

        "#":
            "Shift + 3",

        "$":
            "Shift + 4",

        "%":
            "Shift + 5",

        "&":
            "Shift + 6",

        "'":
            "Shift + 7",

        "(":
            "Shift + 8",

        ")":
            "Shift + 9",

        "=":
            "Shift + -",

        "~":
            "Shift + ^",

        "|":
            "Shift + \\",

        "`":
            "Shift + @",

        "{":
            "Shift + [",

        "}":
            "Shift + ]",

        "+":
            "Shift + ;",

        "*":
            "Shift + :",

        "<":
            "Shift + ,",

        ">":
            "Shift + .",

        "?":
            "Shift + /",

        "_":
            "Shift + \\"

    };


    /*
     * SPACE
     */
    if (
        character === " "
    ) {

        return "SPACE";

    }


    /*
     * マップに存在
     */
    if (
        Object.prototype.hasOwnProperty.call(
            map,
            character
        )
    ) {

        return map[character];

    }


    /*
     * アルファベット
     */
    if (
        /^[a-z]$/i.test(
            character
        )
    ) {

        return character.toUpperCase();

    }


    /*
     * 数字
     */
    if (
        /^[0-9]$/.test(
            character
        )
    ) {

        return character;

    }


    /*
     * その他
     */
    return character;

}


/* =========================================================
   KEY EFFECT
========================================================= */

function flashPressedKey(
    keyValue
) {

    let target =
        null;


    DOM.keys.forEach(
        key => {

            const datasetKey =
                String(
                    key.dataset.key || ""
                ).toLowerCase();


            if (
                datasetKey ===
                keyValue
            ) {

                target =
                    key;

            }

        }
    );


    /*
     * 対応キーなし
     */
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


/* =========================================================
   CLEAR CURRENT KEY
========================================================= */

function clearCurrentKeys() {

    DOM.keys.forEach(
        key => {

            key.classList.remove(
                "current"
            );

        }
    );

}


/* =========================================================
   CLEAR PRESSED KEY
========================================================= */

function clearPressedKeys() {

    DOM.keys.forEach(
        key => {

            key.classList.remove(
                "pressed"
            );

        }
    );

}


/* =========================================================
   EFFECT
========================================================= */

function flashEffect(
    element
) {

    if (!element) {

        return;

    }


    /*
     * 一旦解除
     */
    element.classList.remove(
        "show"
    );


    /*
     * 再描画
     */
    void element.offsetWidth;


    /*
     * 表示
     */
    element.classList.add(
        "show"
    );


    /*
     * 消去
     */
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

    if (
        DOM.typingInput
    ) {

        DOM.typingInput.value =
            "";

    }

}


/* =========================================================
   FOCUS INPUT
========================================================= */

function focusInput() {

    if (
        state.finalFinished
    ) {

        return;

    }


    if (
        !DOM.typingInput
    ) {

        return;

    }


    try {

        DOM.typingInput.focus({
            preventScroll:
                true
        });

    }
    catch {

        DOM.typingInput.focus();

    }

}


/* =========================================================
   HIDE OVERLAYS
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

function showError(
    message
) {

    console.error(
        "[KIR ERROR]",
        message
    );


    const errorMessage =
        document.getElementById(
            "error-message"
        );


    const errorOverlay =
        document.getElementById(
            "error-overlay"
        );


    if (
        errorMessage
    ) {

        errorMessage.textContent =
            String(message);

    }


    if (
        errorOverlay
    ) {

        errorOverlay.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    milliseconds
) {

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
            (
                safe % 60000
            ) / 1000
        );


    const millis =
        Math.floor(
            safe % 1000
        );


    return (

        String(minutes)
            .padStart(
                2,
                "0"
            )

        +

        ":" +

        String(seconds)
            .padStart(
                2,
                "0"
            )

        +

        "." +

        String(millis)
            .padStart(
                3,
                "0"
            )

    );

}


/* =========================================================
   SLEEP
========================================================= */

function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================================
   DEBUG API
========================================================= */

window.KIR_GAME = {

    /*
     * 現在状態
     */
    getState() {

        return state;

    },


    /*
     * リロード
     */
    restart() {

        location.reload();

    },


    /*
     * スタート
     */
    start() {

        if (
            state.titleScreen &&
            state.dataReady
        ) {

            startCountdown();

        }

    },


    /*
     * 現在区間を強制終了
     */
    finishSection() {

        finishSection();

    }

};


/* =========================================================
   END
========================================================= */