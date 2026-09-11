// ========================================
// KIR RECREATION TOURNAMENT 2026
// めちゃむずキーボード早打ち駅伝
// 完成版 game.js
// 前半
// ========================================

"use strict";

// ========================================
// GAME SETTINGS
// ========================================

const TOTAL_SECTIONS = 6;
const VALID_TEAMS = ["A", "B", "C", "D", "E", "F"];

const COUNTDOWN_TIME = 1000;
const NEXT_QUESTION_DELAY = 200;

// ========================================
// TEAM
// URLパラメータで決定・固定
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
        ["progress-percent", progressPercent],

        ["romaji-progress", romajiProgress],

        ["countdown-overlay", countdownOverlay],
        ["countdown", countdown],

        ["result-overlay", resultOverlay],
        ["result-time", resultTime],
        ["result-score", resultScore],
        ["result-miss", resultMiss],

        ["error-overlay", errorOverlay],
        ["error-message", errorMessage],
        ["error-reload-button", errorReloadButton],

        ["final-overlay", finalOverlay],
        ["final-time", finalTime],
        ["final-score", finalScore],
        ["final-miss", finalMiss],

        ["restart-button", restartButton],

        ["score", scoreDisplay],
        ["miss", missDisplay],
        ["combo", comboDisplay],
        ["accuracy", accuracyDisplay],
        ["game-state", gameStateDisplay]
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
// TEAM APPLY
// ========================================

function applyTeam() {

    teamName.textContent = TEAM;

    runner.src = `img/character/${TEAM}team.png`;
    runner.alt = `Team ${TEAM}`;

    runner.onerror = () => {
        showError(
            `ランナー画像を読み込めません。\n\n` +
            `必要なファイル:\n` +
            `img/character/${TEAM}team.png`
        );
    };
}

// ========================================
// CSV LOADING
// section1〜section6
// ========================================

async function loadAllSections() {

    questionText.textContent =
        "問題データを読み込んでいます……";

    for (
        let section = 1;
        section <= TOTAL_SECTIONS;
        section++
    ) {

        const path = `data/section${section}.csv`;

        let response;

        try {

            response = await fetch(
                path,
                {
                    cache: "no-store"
                }
            );

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

        validateSectionQuestions(
            rows,
            section,
            path
        );

        sectionsData[section] = rows;
    }
}

// ========================================
// CSV PARSER
// BOM / quoted field / comma / 改行 / ""
// に対応
// ========================================

function parseCSV(csvText, path) {

    // BOM除去
    csvText = csvText.replace(/^\uFEFF/, "");

    const rows = [];
    let row = [];
    let field = "";

    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {

        const char = csvText[i];
        const next = csvText[i + 1];

        // --------------------------------
        // ダブルクォート
        // --------------------------------

        if (char === '"') {

            // "" → "
            if (inQuotes && next === '"') {

                field += '"';
                i++;
                continue;
            }

            inQuotes = !inQuotes;
            continue;
        }

        // --------------------------------
        // カンマ
        // --------------------------------

        if (char === "," && !inQuotes) {

            row.push(field);
            field = "";

            continue;
        }

        // --------------------------------
        // 改行
        // --------------------------------

        if (
            (char === "\n" || char === "\r") &&
            !inQuotes
        ) {

            // CRLFの場合、LFをスキップ
            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(field);
            field = "";

            // 完全空行は除外
            if (
                row.some(value => value !== "")
            ) {
                rows.push(row);
            }

            row = [];

            continue;
        }

        // --------------------------------
        // 通常文字
        // --------------------------------

        field += char;
    }

    // --------------------------------
    // 最終フィールド
    // --------------------------------

    if (inQuotes) {

        throw new Error(
            `${path} のCSVで、閉じていないダブルクォートがあります。`
        );
    }

    if (
        field !== "" ||
        row.length > 0
    ) {

        row.push(field);

        if (
            row.some(value => value !== "")
        ) {
            rows.push(row);
        }
    }

    if (rows.length < 2) {

        throw new Error(
            `${path} に問題データがありません。`
        );
    }

    // ====================================
    // HEADER
    // ====================================

    const headers = rows[0].map(
        header => header.trim()
    );

    const requiredHeaders = [
        "question_no",
        "section",
        "title",
        "display",
        "answer"
    ];

    for (const header of requiredHeaders) {

        if (!headers.includes(header)) {

            throw new Error(
                `${path} に「${header}」列がありません。`
            );
        }
    }

    // ====================================
    // DATA
    // ====================================

    const result = [];

    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const values = rows[i];

        const rowObject = {};

        headers.forEach(
            (header, index) => {

                const value =
                    values[index] ?? "";

                // answerだけはtrimしない
                // スペースそのものが入力対象だから
                if (header === "answer") {

                    rowObject[header] = value;

                } else {

                    rowObject[header] =
                        value.trim();
                }
            }
        );

        // --------------------------------
        // スペース変換
        // --------------------------------

        rowObject.answer =
            rowObject.answer
                .replaceAll(
                    "[半角スペース]",
                    " "
                )
                .replaceAll(
                    "[全角スペース]",
                    "　"
                );

        result.push(rowObject);
    }

    return result;
}

// ========================================
// CSV VALIDATION
// ========================================

function validateSectionQuestions(
    rows,
    section,
    path
) {

    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        throw new Error(
            `${path} に問題が1問もありません。`
        );
    }

    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const q = rows[i];

        const csvLine = i + 2;

        // --------------------------------
        // question_no
        // --------------------------------

        const expectedQuestionNo =
            i + 1;

        if (
            String(q.question_no).trim() !==
            String(expectedQuestionNo)
        ) {

            throw new Error(
                `${path} ${csvLine}行目: ` +
                `question_no が ${expectedQuestionNo} ではありません。`
            );
        }

        // --------------------------------
        // section
        // --------------------------------

        if (
            String(q.section).trim() !==
            String(section)
        ) {

            throw new Error(
                `${path} ${csvLine}行目: ` +
                `section が SECTION ${section} と一致しません。`
            );
        }

        // --------------------------------
        // display
        // --------------------------------

        if (!q.display) {

            throw new Error(
                `${path} ${csvLine}行目: ` +
                `display がありません。`
            );
        }

        // --------------------------------
        // answer
        // --------------------------------

        if (!q.answer) {

            throw new Error(
                `${path} ${csvLine}行目: ` +
                `answer がありません。`
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

    sectionQuestions =
        sectionsData[currentSection];

    if (
        !Array.isArray(sectionQuestions) ||
        sectionQuestions.length === 0
    ) {

        throw new Error(
            `SECTION ${currentSection} に問題データがありません。`
        );
    }

    currentQuestionIndex = 0;

    // --------------------------------
    // SECTION総文字数
    // --------------------------------

    sectionTotalChars =
        sectionQuestions.reduce(
            (sum, q) =>
                sum + q.answer.length,
            0
        );

    sectionCharsTyped = 0;

    // --------------------------------
    // UI
    // --------------------------------

    sectionNumber.textContent =
        currentSection;

    progressTotal.textContent =
        sectionQuestions.length;

    progressCurrent.textContent = "0";

    progressFill.style.width = "0%";

    progressPercent.textContent = "0%";

    timerDisplay.textContent =
        "00:00.000";

    updateScore();

    resetRunner();

    showSectionReady();
}

// ========================================
// READY画面
// ========================================

function showSectionReady() {

    questionNumber.textContent =
        "QUESTION 1";

    questionText.textContent =
        `SECTION ${currentSection} / PRESS ENTER TO START`;

    romajiProgress.innerHTML = "";

    gameStateDisplay.textContent =
        "READY";
}

// ========================================
// COUNTDOWN
// ========================================

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}

async function startCountdown() {

    countdownOverlay.classList.add("active");

    countdownOverlay.setAttribute(
        "aria-hidden",
        "false"
    );

    const seq = [
        "3",
        "2",
        "1",
        "GO!"
    ];

    for (const value of seq) {

        countdown.textContent = value;

        countdown.classList.remove(
            "countdown-pop"
        );

        void countdown.offsetWidth;

        countdown.classList.add(
            "countdown-pop"
        );

        await sleep(COUNTDOWN_TIME);
    }

    countdownOverlay.classList.remove(
        "active"
    );

    countdownOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    startGame();
}

// ========================================
// START GAME
// ========================================

function startGame() {

    gameStarted = true;

    sectionStartTime =
        performance.now();

    startTimer();

    // typing-inputは見た目だけ
    // 実際の入力判定はdocumentのkeydown
    typingInput.disabled = true;
    typingInput.value = "";

    gameStateDisplay.textContent =
        "PLAYING";

    showQuestion();
}

// ========================================
// TIMER
// performance.now()ベース
// ========================================

function startTimer() {

    stopTimer();

    timerInterval = setInterval(
        () => {

            if (!gameStarted) {
                return;
            }

            const elapsed =
                performance.now() -
                sectionStartTime;

            timerDisplay.textContent =
                formatTime(elapsed);

        },
        10
    );
}

function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );
    }

    timerInterval = null;
}

// ========================================
// TIME FORMAT
// ========================================

function formatTime(ms) {

    const totalSeconds =
        ms / 1000;

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        Math.floor(
            totalSeconds % 60
        );

    const milli =
        Math.floor(
            ms % 1000
        );

    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}.` +
        `${String(milli).padStart(3, "0")}`
    );
}

// ========================================
// SHOW QUESTION
// ========================================

function showQuestion() {

    if (
        currentQuestionIndex >=
        sectionQuestions.length
    ) {

        finishSection();
        return;
    }

    const q =
        sectionQuestions[
            currentQuestionIndex
        ];

    currentAnswer = q.answer;

    currentPosition = 0;

    questionNumber.textContent =
        `QUESTION ${currentQuestionIndex + 1}`;

    questionText.textContent =
        q.display;

    renderRomajiProgress();

    updateProgress();
}

// ========================================
// ROMAJI PROGRESS
// ========================================

function renderRomajiProgress() {

    const typed =
        currentAnswer.slice(
            0,
            currentPosition
        );

    const rest =
        currentAnswer.slice(
            currentPosition
        );

    romajiProgress.innerHTML =
        `<span class="romaji-typed">${escapeHtml(typed)}</span>` +
        `<span class="romaji-rest">${escapeHtml(rest)}</span>`;
}

// ========================================
// HTML ESCAPE
// CSVの < > & などを安全に表示
// ========================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ========================================
// KEYDOWN
// ENTER開始 / 1文字判定
// ========================================

document.addEventListener(
    "keydown",
    handleKeydown
);

function handleKeydown(event) {

    // ====================================
    // READY
    // ENTER → COUNTDOWN
    // ====================================

    if (
        !gameStarted &&
        !sectionFinished &&
        !countdownOverlay.classList.contains("active") &&
        event.key === "Enter" &&
        !resultOverlay.classList.contains("active") &&
        !finalOverlay.classList.contains("active")
    ) {

        event.preventDefault();

        startCountdown();

        return;
    }

    // ====================================
    // SECTION FINISH
    // ENTER → NEXT SECTION
    // ====================================

    if (
        resultOverlay.classList.contains("active") &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        resultOverlay.classList.remove(
            "active"
        );

        resultOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        currentSection++;

        if (
            currentSection >
            TOTAL_SECTIONS
        ) {

            finishRace();

            return;
        }

        prepareSection();

        return;
    }

    // ====================================
    // FINAL
    // ENTER → RESTART
    // ====================================

    if (
        finalOverlay.classList.contains("active") &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        restartGame();

        return;
    }

    // ====================================
    // PLAYING CHECK
    // ====================================

    if (
        !gameStarted ||
        sectionFinished ||
        processingAnswer
    ) {

        return;
    }

    // ====================================
    // 1文字以外は無視
    // ====================================

    if (event.key.length !== 1) {
        return;
    }

    event.preventDefault();

    // ====================================
    // TARGET CHARACTER
    // ====================================

    const target =
        currentAnswer[
            currentPosition
        ];

    if (!target) {
        return;
    }

    const inputChar =
        event.key;

    // ====================================
    // MISS
    // ====================================

    if (
        inputChar !== target
    ) {

        miss++;

        combo = 0;

        updateScore();

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

    // ====================================
    // QUESTION COMPLETE
    // ====================================

    if (
        currentPosition >=
        currentAnswer.length
    ) {

        processingAnswer = true;

        setTimeout(
            () => {

                currentQuestionIndex++;

                processingAnswer = false;

                if (
                    currentQuestionIndex >=
                    sectionQuestions.length
                ) {

                    finishSection();

                } else {

                    showQuestion();
                }

            },
            NEXT_QUESTION_DELAY
        );
    }
}

// ========================================
// SCORE DISPLAY
// ========================================

function updateScore() {

    scoreDisplay.textContent =
        score;

    missDisplay.textContent =
        miss;

    comboDisplay.textContent =
        combo;

    const attempts =
        score + miss;

    const accuracy =
        attempts > 0
            ? Math.round(
                (score / attempts) * 100
            )
            : 100;

    accuracyDisplay.textContent =
        `${accuracy}%`;
}

// ========================================
// PROGRESS
// 問題数ベース
// ========================================

function updateProgress() {

    const current =
        currentQuestionIndex;

    const total =
        sectionQuestions.length;

    progressCurrent.textContent =
        current;

    progressTotal.textContent =
        total;

    const percent =
        total > 0
            ? (current / total) * 100
            : 0;

    progressFill.style.width =
        `${percent}%`;

    progressPercent.textContent =
        `${Math.round(percent)}%`;
}

// ========================================
// RUNNER
// 総文字数ベース
// ========================================

function resetRunner() {

    runner.style.left = "0%";

    runner.classList.remove(
        "runner-finish"
    );
}

function moveRunner() {

    if (
        sectionTotalChars <= 0
    ) {
        return;
    }

    const percent =
        (
            sectionCharsTyped /
            sectionTotalChars
        ) * 100;

    // 画像がコース外にはみ出さないよう
    // 表示上の最大位置を94%にする
    const safePercent =
        Math.min(
            percent,
            94
        );

    runner.style.left =
        `${safePercent}%`;

    if (
        sectionCharsTyped >=
        sectionTotalChars
    ) {

        runner.classList.add(
            "runner-finish"
        );
    }
}

// ========================================
// KIR RECREATION TOURNAMENT 2026
// めちゃむずキーボード早打ち駅伝
// 完成版 game.js
// 後半
// ========================================

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

        gameStateDisplay.textContent =
            "FINISH";
    }

    // --------------------------------
    // SECTION時間確定
    // --------------------------------

    const elapsed =
        performance.now() -
        sectionStartTime;

    sectionTimes[
        currentSection - 1
    ] = elapsed;

    // --------------------------------
    // TOTALへ加算
    // --------------------------------

    totalScore += score;
    totalMiss += miss;

    // --------------------------------
    // TIMER表示
    // --------------------------------

    timerDisplay.textContent =
        formatTime(elapsed);

    // --------------------------------
    // RESULT
    // --------------------------------

    resultTime.textContent =
        formatTime(elapsed);

    resultScore.textContent =
        score;

    resultMiss.textContent =
        miss;

    resultOverlay.classList.add(
        "active"
    );

    resultOverlay.setAttribute(
        "aria-hidden",
        "false"
    );
}

// ========================================
// FINAL RACE
// SECTION 6終了
// ========================================

function finishRace() {

    stopTimer();

    gameStarted = false;

    sectionFinished = true;

    typingInput.disabled = true;

    if (gameStateDisplay) {

        gameStateDisplay.textContent =
            "RACE FINISH";
    }

    // --------------------------------
    // 6 SECTION TOTAL TIME
    // --------------------------------

    const totalElapsed =
        sectionTimes.reduce(
            (sum, time) =>
                sum + (time || 0),
            0
        );

    // --------------------------------
    // FINAL DISPLAY
    // --------------------------------

    finalTime.textContent =
        formatTime(totalElapsed);

    finalScore.textContent =
        totalScore;

    finalMiss.textContent =
        totalMiss;

    finalOverlay.classList.add(
        "active"
    );

    finalOverlay.setAttribute(
        "aria-hidden",
        "false"
    );
}

// ========================================
// RESTART
// ========================================

restartButton.addEventListener(
    "click",
    restartGame
);

function restartGame() {

    stopTimer();

    // --------------------------------
    // SECTION
    // --------------------------------

    currentSection = 1;

    currentQuestionIndex = 0;

    // --------------------------------
    // SCORE
    // --------------------------------

    score = 0;
    miss = 0;
    combo = 0;

    totalScore = 0;
    totalMiss = 0;

    // --------------------------------
    // TIME
    // --------------------------------

    sectionTimes = [];

    sectionStartTime = 0;

    // --------------------------------
    // RUNNER
    // --------------------------------

    sectionTotalChars = 0;
    sectionCharsTyped = 0;

    // --------------------------------
    // STATE
    // --------------------------------

    gameStarted = false;
    sectionFinished = false;
    processingAnswer = false;

    currentAnswer = "";
    currentPosition = 0;

    // --------------------------------
    // OVERLAY
    // --------------------------------

    resultOverlay.classList.remove(
        "active"
    );

    resultOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    finalOverlay.classList.remove(
        "active"
    );

    finalOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    errorOverlay.classList.remove(
        "active"
    );

    errorOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    countdownOverlay.classList.remove(
        "active"
    );

    countdownOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    // --------------------------------
    // TIMER
    // --------------------------------

    timerDisplay.textContent =
        "00:00.000";

    // --------------------------------
    // SCORE
    // --------------------------------

    updateScore();

    // --------------------------------
    // SECTION 1 READY
    // --------------------------------

    prepareSection();
}

// ========================================
// ERROR DISPLAY
// ========================================

function showError(message) {

    stopTimer();

    gameStarted = false;

    sectionFinished = true;

    typingInput.disabled = true;

    errorMessage.textContent =
        message;

    errorOverlay.classList.add(
        "active"
    );

    errorOverlay.setAttribute(
        "aria-hidden",
        "false"
    );
}

// ========================================
// ERROR RELOAD
// ========================================

errorReloadButton.addEventListener(
    "click",
    () => {

        location.reload();
    }
);

// ========================================
// STARTUP
// ========================================

async function initializeGame() {

    try {

        // --------------------------------
        // DOM確認
        // --------------------------------

        checkDOM();

        // --------------------------------
        // TEAM確認
        // --------------------------------

        applyTeam();

        // --------------------------------
        // 初期スコア
        // --------------------------------

        updateScore();

        // --------------------------------
        // 初期タイマー
        // --------------------------------

        timerDisplay.textContent =
            "00:00.000";

        // --------------------------------
        // DEBUG LOG
        // --------------------------------

        console.log(
            "========================================"
        );

        console.log(
            "KIR Typing Game START / TEAM:",
            TEAM
        );

        console.log(
            "========================================"
        );

        // --------------------------------
        // CSV全読み込み
        // --------------------------------

        await loadAllSections();

        // --------------------------------
        // SECTION 1 READY
        // --------------------------------

        prepareSection();

    } catch (error) {

        console.error(
            "ゲーム初期化エラー:",
            error
        );

        showError(
            "ゲームの初期化に失敗しました。\n\n" +
            error.message
        );
    }
}

// ========================================
// DOM READY
// ========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGame
    );

} else {

    initializeGame();
}