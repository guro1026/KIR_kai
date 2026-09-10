// ========================================
// KIR RECREATION TOURNAMENT 2026
// めちゃむずキーボード早打ち駅伝
// ========================================

"use strict";


// ========================================
// GAME SETTINGS
// ========================================

const TOTAL_SECTIONS = 6;
const QUESTION_SCORE = 100;
const COUNTDOWN_TIME = 1000;
const NEXT_QUESTION_DELAY = 150;


// ========================================
// GAME STATE
// ========================================

let questions = [];

let currentSection = 1;
let currentQuestionIndex = 0;
let sectionQuestions = [];

let score = 0;
let miss = 0;
let combo = 0;

let sectionStartTime = 0;
let totalStartTime = 0;

let timerInterval = null;

let gameStarted = false;
let sectionFinished = false;
let processingAnswer = false;


// ========================================
// DOM
// ========================================

const sectionNumber =
    document.getElementById("section-number");

const questionNumber =
    document.getElementById("question-number");

const questionText =
    document.getElementById("question-text");

const typingInput =
    document.getElementById("typing-input");

const timerDisplay =
    document.getElementById("timer");

const teamName =
    document.getElementById("team-name");

const runner =
    document.getElementById("runner");

const progressCurrent =
    document.getElementById("progress-current");

const progressTotal =
    document.getElementById("progress-total");

const progressFill =
    document.getElementById("progress-fill");

const countdownOverlay =
    document.getElementById("countdown-overlay");

const countdown =
    document.getElementById("countdown");

const resultOverlay =
    document.getElementById("result-overlay");

const resultTime =
    document.getElementById("result-time");

const resultScore =
    document.getElementById("result-score");

const resultMiss =
    document.getElementById("result-miss");

const nextSectionButton =
    document.getElementById("next-section-button");

const errorOverlay =
    document.getElementById("error-overlay");

const errorMessage =
    document.getElementById("error-message");

const errorReloadButton =
    document.getElementById("error-reload-button");

const finalOverlay =
    document.getElementById("final-overlay");

const finalTime =
    document.getElementById("final-time");

const finalScore =
    document.getElementById("final-score");

const finalMiss =
    document.getElementById("final-miss");

const restartButton =
    document.getElementById("restart-button");


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
// CSV LOADING
// ========================================

async function loadQuestions() {

    try {

        questionText.textContent =
            "問題データを読み込んでいます……";

        const response =
            await fetch("data/questions.csv", {
                cache: "no-store"
            });

        if (!response.ok) {

            throw new Error(
                `questions.csv の読み込みに失敗しました。\n` +
                `HTTP Status: ${response.status}`
            );
        }

        const csvText =
            await response.text();

        if (!csvText.trim()) {

            throw new Error(
                "questions.csv が空です。"
            );
        }

        questions =
            parseCSV(csvText);

        validateQuestions();

        console.log(
            "CSV読み込み完了:",
            questions
        );

        prepareSection();

    } catch (error) {

        console.error(
            "CSV読み込みエラー:",
            error
        );

        showError(
            "問題データを読み込めませんでした。\n\n" +
            error.message
        );
    }
}


// ========================================
// CSV PARSER
// ========================================

function parseCSV(csvText) {

    // UTF-8 BOM除去
    csvText =
        csvText.replace(/^\uFEFF/, "");

    const lines =
        csvText
            .split(/\r?\n/)
            .filter(line => line.trim() !== "");

    if (lines.length < 2) {

        throw new Error(
            "CSVに問題データがありません。"
        );
    }

    const headers =
        parseCSVLine(lines[0])
            .map(header =>
                header
                    .replace(/^\uFEFF/, "")
                    .trim()
            );

    const requiredHeaders = [
        "id",
        "section",
        "type",
        "text",
        "answer"
    ];

    for (const header of requiredHeaders) {

        if (!headers.includes(header)) {

            throw new Error(
                `CSVに「${header}」列がありません。`
            );
        }
    }

    const result = [];

    for (let i = 1; i < lines.length; i++) {

        const values =
            parseCSVLine(lines[i]);

        if (
            values.length === 1 &&
            values[0].trim() === ""
        ) {
            continue;
        }

        const question = {};

        headers.forEach(
            (header, index) => {

                question[header] =
                    (values[index] ?? "").trim();
            }
        );

        result.push(question);
    }

    return result;
}


// ========================================
// CSV LINE PARSER
// ========================================

function parseCSVLine(line) {

    const result = [];

    let current = "";
    let insideQuotes = false;

    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char = line[i];

        // ダブルクォート
        if (char === '"') {

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';
                i++;

            } else {

                insideQuotes =
                    !insideQuotes;
            }

        // カンマ
        } else if (
            char === "," &&
            !insideQuotes
        ) {

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
// CSV VALIDATION
// ========================================

function validateQuestions() {

    if (!Array.isArray(questions)) {

        throw new Error(
            "問題データが正しくありません。"
        );
    }

    if (questions.length === 0) {

        throw new Error(
            "問題が1問もありません。"
        );
    }

    for (
        let i = 0;
        i < questions.length;
        i++
    ) {

        const q = questions[i];

        if (!q.section) {

            throw new Error(
                `問題 ${i + 1}: section がありません。`
            );
        }

        if (!q.text) {

            throw new Error(
                `問題 ${i + 1}: text がありません。`
            );
        }

        if (!q.answer) {

            throw new Error(
                `問題 ${i + 1}: answer がありません。`
            );
        }
    }

    // 6区間すべて存在するか確認
    for (
        let section = 1;
        section <= TOTAL_SECTIONS;
        section++
    ) {

        const count =
            questions.filter(
                q =>
                    Number(q.section) === section
            ).length;

        if (count === 0) {

            throw new Error(
                `SECTION ${section} の問題がありません。`
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

    sectionQuestions =
        questions.filter(
            question =>
                Number(question.section) ===
                currentSection
        );

    if (sectionQuestions.length === 0) {

        showError(
            `SECTION ${currentSection} に問題がありません。`
        );

        return;
    }

    currentQuestionIndex = 0;

    sectionNumber.textContent =
        currentSection;

    progressTotal.textContent =
        sectionQuestions.length;

    progressCurrent.textContent = "0";

    progressFill.style.width = "0%";

    resetRunner();

    showQuestion();

    startCountdown();
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

    const question =
        sectionQuestions[currentQuestionIndex];

    questionNumber.textContent =
        `QUESTION ${currentQuestionIndex + 1}`;

    questionText.textContent =
        question.text;

    typingInput.value = "";

    updateProgress();
}


// ========================================
// COUNTDOWN
// ========================================

function sleep(milliseconds) {

    return new Promise(
        resolve =>
            setTimeout(resolve, milliseconds)
    );
}


async function startCountdown() {

    gameStarted = false;
    typingInput.disabled = true;

    countdownOverlay.style.display =
        "flex";

    const count = [
        "3",
        "2",
        "1",
        "GO!"
    ];

    for (const value of count) {

        countdown.textContent =
            value;

        countdown.classList.remove(
            "countdown-pop"
        );

        // CSSアニメーションを再実行
        void countdown.offsetWidth;

        countdown.classList.add(
            "countdown-pop"
        );

        await sleep(COUNTDOWN_TIME);
    }

    countdownOverlay.style.display =
        "none";

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

    sectionStartTime =
        performance.now();

    if (currentSection === 1) {

        totalStartTime =
            performance.now();
    }

    startTimer();

    typingInput.disabled = false;

    typingInput.focus();
}


// ========================================
// TIMER
// ========================================

function startTimer() {

    stopTimer();

    timerInterval =
        setInterval(() => {

            if (!gameStarted) {
                return;
            }

            const elapsed =
                performance.now() -
                sectionStartTime;

            timerDisplay.textContent =
                formatTime(elapsed);

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

    const totalSeconds =
        milliseconds / 1000;

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        Math.floor(totalSeconds % 60);

    const ms =
        Math.floor(milliseconds % 1000);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(ms).padStart(3, "0")
    );
}


// ========================================
// TYPING INPUT
// ========================================

typingInput.addEventListener(
    "input",
    handleTyping
);


function handleTyping() {

    if (!gameStarted) {
        return;
    }

    if (processingAnswer) {
        return;
    }

    const question =
        sectionQuestions[currentQuestionIndex];

    if (!question) {
        return;
    }

    const answer =
        question.answer;

    const input =
        typingInput.value;


    // ====================================
    // WRONG
    // ====================================

    if (!answer.startsWith(input)) {

        miss++;

        combo = 0;

        updateScore();

        showEffect("miss");

        // 間違った最後の1文字だけ削除
        typingInput.value =
            input.slice(0, -1);

        return;
    }


    // ====================================
    // CORRECT
    // ====================================

    if (input === answer) {

        processingAnswer = true;

        score += QUESTION_SCORE;

        combo++;

        updateScore();

        showEffect("good");

        // コンボが一定以上ならBOOST
        if (combo >= 5 && combo % 5 === 0) {

            showEffect("boost");
        }

        moveRunner();

        setTimeout(() => {

            currentQuestionIndex++;

            processingAnswer = false;

            if (
                currentQuestionIndex >=
                sectionQuestions.length
            ) {

                finishSection();

            } else {

                showQuestion();

                typingInput.focus();
            }

        }, NEXT_QUESTION_DELAY);
    }
}


// ========================================
// SCORE DISPLAY
// ========================================

function updateScore() {

    document.getElementById("score")
        .textContent = score;

    document.getElementById("miss")
        .textContent = miss;

    document.getElementById("combo")
        .textContent = combo;
}


// ========================================
// PROGRESS
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

    if (total <= 0) {

        progressFill.style.width =
            "0%";

        return;
    }

    const percent =
        (current / total) * 100;

    progressFill.style.width =
        `${percent}%`;
}


// ========================================
// RUNNER
// ========================================

function resetRunner() {

    runner.style.left =
        "0%";

    runner.classList.remove(
        "runner-finish"
    );
}


function moveRunner() {

    const total =
        sectionQuestions.length;

    if (total <= 0) {
        return;
    }

    const percent =
        ((currentQuestionIndex + 1) /
            total) * 100;

    /*
     * 旗の直前まで走らせる。
     * 100%まで行くと画像が画面外に出るため
     * 最大94%に制限。
     */

    const safePercent =
        Math.min(percent, 94);

    runner.style.left =
        `${safePercent}%`;

    if (
        currentQuestionIndex + 1 >=
        total
    ) {

        runner.classList.add(
            "runner-finish"
        );
    }
}


// ========================================
// EFFECT
// ========================================

function showEffect(type) {

    let effect = null;

    if (type === "good") {

        effect =
            document.getElementById(
                "good-effect"
            );

    } else if (type === "miss") {

        effect =
            document.getElementById(
                "miss-effect"
            );

    } else if (type === "boost") {

        effect =
            document.getElementById(
                "boost-effect"
            );
    }

    if (!effect) {
        return;
    }

    effect.classList.remove(
        "effect-show"
    );

    void effect.offsetWidth;

    effect.classList.add(
        "effect-show"
    );
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

    const elapsed =
        performance.now() -
        sectionStartTime;

    timerDisplay.textContent =
        formatTime(elapsed);

    resultTime.textContent =
        formatTime(elapsed);

    resultScore.textContent =
        score;

    resultMiss.textContent =
        miss;

    resultOverlay.style.display =
        "flex";
}


// ========================================
// NEXT SECTION
// ========================================

nextSectionButton.addEventListener(
    "click",
    () => {

        resultOverlay.style.display =
            "none";

        currentSection++;

        if (
            currentSection >
            TOTAL_SECTIONS
        ) {

            finishRace();

            return;
        }

        prepareSection();
    }
);


// ========================================
// FINAL RACE
// ========================================

function finishRace() {

    stopTimer();

    gameStarted = false;

    typingInput.disabled = true;

    const totalElapsed =
        performance.now() -
        totalStartTime;

    finalTime.textContent =
        formatTime(totalElapsed);

    finalScore.textContent =
        score;

    finalMiss.textContent =
        miss;

    finalOverlay.style.display =
        "flex";
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

    currentSection = 1;
    currentQuestionIndex = 0;

    score = 0;
    miss = 0;
    combo = 0;

    sectionStartTime = 0;
    totalStartTime = 0;

    gameStarted = false;
    sectionFinished = false;
    processingAnswer = false;

    resultOverlay.style.display =
        "none";

    finalOverlay.style.display =
        "none";

    errorOverlay.style.display =
        "none";

    timerDisplay.textContent =
        "00:00.000";

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

    errorMessage.textContent =
        message;

    errorOverlay.style.display =
        "flex";
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
// KEYBOARD SAFETY
// ========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            gameStarted
        ) {

            event.preventDefault();
        }
    }
);


// ========================================
// STARTUP
// ========================================

async function initializeGame() {

    try {

        checkDOM();

        updateScore();

        timerDisplay.textContent =
            "00:00.000";

        console.log(
            "========================================"
        );

        console.log(
            "KIR Typing Game START"
        );

        console.log(
            "========================================"
        );

        await loadQuestions();

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