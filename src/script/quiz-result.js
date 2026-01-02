import { isAuthenticated, requireAuth } from "./core/auth_guard";
import { categoryFormatter, intervalFormatter, launchFireworks } from "./core/utils";

const excellent =new Audio("../sounds/excellent.mp3");
const tried =new Audio("../sounds/tried.mp3");
const failure =new Audio("../sounds/failure.mp3")

function playExcellent(){
    excellent.currentTime = 0;
    excellent.play()
    launchFireworks()
}

function playTried(){
    tried.currentTime = 0
    tried.play();
}

function playFailure(){
    failure.currentTime = 0;
    failure.play();
}


const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const authButtons = document.getElementById("authButtons");
const isLoggedIn = isAuthenticated();
let user;

if (isLoggedIn) {
    user = requireAuth();
    profileBtn.textContent = user.profile.username[0].toUpperCase();
    authButtons.classList.add("hidden");
} else {
    profileBtn.classList.add("hidden");
}

profileBtn.addEventListener("click", () => {
    profileMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add("hidden");
    }
});

const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

console.log(quizId)
let quizSession = null;
let reviewIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadSession();
    writeStats();
    renderReviewQuestion();
    bindReviewNavigation();
    performanceSection();
    bindRetry();
});

function loadSession() {
    if (quizId) {
        quizSession = user.history.find(s => s.id === quizId);

        if (!quizSession) {
            alert("Quiz not found. Redirecting to dashboard.");
            window.location.href = "dashboard.html";
            return;
        }

        console.log("Loaded from history:", quizSession);
        return;
    }

    const stored = sessionStorage.getItem("quizSession");
    if (!stored) {
        alert("No quiz session found. Redirecting to dashboard.");
        window.location.href = "dashboard.html";
        return;
    }

    quizSession = JSON.parse(stored);
    console.log("Loaded from sessionStorage:", quizSession);
}

function renderReviewQuestion() {
    if (!quizSession || !quizSession.questions[reviewIndex]) return;

    const question = quizSession.questions[reviewIndex];
    const answerEntry = quizSession.answers[question.id] || { value: null, isCorrect: null };

    document.getElementById("reviewCurrent").textContent = reviewIndex + 1;
    document.getElementById("reviewTotal").textContent = quizSession.questions.length;
    document.getElementById("reviewCategory").textContent = categoryFormatter(quizSession.category);
    document.getElementById("reviewQuestionText").textContent = question.question;

    const statusEl = document.getElementById("reviewStatus");
    statusEl.className = "inline-block px-6 py-2 rounded-full text-sm font-semibold";

    statusEl.classList.remove("bg-success/20","text-success","border-success/40",
                             "bg-error/20","text-error","border-error/40",
                             "bg-warning/20","text-warning","border-warning/40");

    if (answerEntry.isCorrect === true) {
        statusEl.textContent = "Correct";
        statusEl.classList.add("bg-success/20", "text-success", "border", "border-success/40");
    } else if (answerEntry.isCorrect === false) {
        statusEl.textContent = "Incorrect";
        statusEl.classList.add("bg-error/20", "text-error", "border", "border-error/40");
    } else {
        statusEl.textContent = "Skipped";
        statusEl.classList.add("bg-warning/20", "text-warning", "border", "border-warning/40");
    }

    renderReviewOptions(question, answerEntry);
}

function renderReviewOptions(question, answerEntry) {
    const container = document.getElementById("reviewOptions");
    container.innerHTML = "";

    const userSelected = answerEntry.value;
    const correctAnswer = question.answer;
    document.getElementById("description").textContent = question.explanation

    question.options.forEach(option => {
        const isUserChoice = userSelected === option;
        const isCorrect = option === correctAnswer;

        let classes = ["flex", "items-center", "p-6", "rounded-2xl", "border-2", "text-lg", "font-medium", "transition-all", "duration-200"];
        let iconHTML = "";
        let extraLabel = "";

        if (isCorrect) {
            classes.push("border-success", "bg-success/10", "text-success-foreground");
            iconHTML = `<i class="bx bx-check-circle text-success text-2xl mr-4"></i>`;
            extraLabel = `<span class="block text-sm opacity-80 mt-1 font-medium">Correct answer</span>`;
        }

        if (isUserChoice) {
            if (answerEntry.isCorrect === false) {
                classes = classes.filter(c => !c.includes("success"));
                classes.push("border-error", "bg-error/10", "text-error-foreground");
                iconHTML = `<i class="bx bx-x-circle text-error text-2xl mr-4"></i>`;
                extraLabel = `<span class="block text-sm opacity-80 mt-1 font-medium">Your answer</span>`;
            }
        } else if (!isCorrect) {
            classes.push("border-base-300/40", "opacity-70", "hover:opacity-90");
        }

        const div = document.createElement("div");
        div.className = classes.join(" ");
        div.innerHTML = `${iconHTML}<div class="flex-1">${option}${extraLabel}</div>`;
        container.appendChild(div);
    });
}

function bindReviewNavigation() {
    document.getElementById("reviewNextBtn").addEventListener("click", () => {
        if (reviewIndex < quizSession.questions.length - 1) {
            reviewIndex++;
            renderReviewQuestion();
        }
    });

    document.getElementById("reviewPrevBtn").addEventListener("click", () => {
        if (reviewIndex > 0) {
            reviewIndex--;
            renderReviewQuestion();
        }
    });
}

function writeStats() {
    const time = quizSession.timer.duration - quizSession.timer.remaining;
    const timeTaken = intervalFormatter(time);
    const timeLimit = intervalFormatter(quizSession.timer.duration);
    const percentage = quizSession.result.percentage;
    
    updateScoreRing(percentage)
    
    document.getElementById("correct-num").textContent = quizSession.result.correct;
    document.getElementById("incorrect-num").textContent = quizSession.result.incorrect;
    document.getElementById("correct-numm").textContent = quizSession.result.correct;
    document.getElementById("skipped-num").textContent = quizSession.result.skipped;
    document.getElementById("total-num").textContent = quizSession.result.totalQuestions;
    document.getElementById("total-numm").textContent = quizSession.result.totalQuestions;
    document.getElementById("time-taken").textContent = timeTaken;
    document.getElementById("time-limit").textContent = timeLimit;
    document.getElementById("percent").textContent = percentage;
    document.getElementById("categoryName").textContent = categoryFormatter(quizSession.category);

    if (percentage > 80){
        document.getElementById("congrats").textContent = "Excellent!";
        playExcellent();
    }
    else if (percentage > 60){
        document.getElementById("congrats").textContent = "Great job!";
        playTried()
    }
    else if (percentage > 40){
        document.getElementById("congrats").textContent = "More effort";
        playTried()
    }
    else {
        document.getElementById("congrats").textContent = "Work harder!";
        playFailure();
    } 
}

function performanceSection() {
    const questions = quizSession.questions;
    const easy = questions.filter(q => q.difficulty === "easy");
    const medium = questions.filter(q => q.difficulty === "medium");
    const hard = questions.filter(q => q.difficulty === "hard");

    const easyCorrect = getCorrect(easy);
    const mediumCorrect = getCorrect(medium);
    const hardCorrect = getCorrect(hard);

    document.getElementById("easy-correct").textContent = `${easyCorrect} / ${easy.length} correct`;
    document.getElementById("medium-correct").textContent = `${mediumCorrect} / ${medium.length} correct`;
    document.getElementById("hard-correct").textContent = `${hardCorrect} / ${hard.length} correct`;

    document.getElementById("easy-percent").textContent = easy.length ? `${Math.floor(easyCorrect / easy.length * 100)}%` : "-";
    document.getElementById("medium-percent").textContent = medium.length ? `${Math.floor(mediumCorrect / medium.length * 100)}%` : "-";
    document.getElementById("hard-percent").textContent = hard.length ? `${Math.floor(hardCorrect / hard.length * 100)}%` : "-";
}

function getCorrect(questions) {
    return questions.filter(q => quizSession?.answers?.[q.id]?.isCorrect === true).length;
}

function bindRetry() {
    const retryBtn = document.getElementById("retryQuiz");
    if (!retryBtn) return;

    retryBtn.addEventListener("click", () => {
        const retryPayload = {
            category: quizSession.category,
            questions: quizSession.questions,
            count: quizSession.questions.length,
            timeLimit: quizSession.timer.duration / 2
        };

        sessionStorage.setItem("quizRetry", JSON.stringify(retryPayload));
        sessionStorage.removeItem("quizSession");
        window.location.href = "./quiz.html";
    });
}

function updateScoreRing(percentage) {
    const ring = document.getElementById("scoreRing");
    const percentEl = document.getElementById("percent");

    if (!ring || !percentEl) return;

    const value = Math.max(0, Math.min(100, Number(percentage)));

    let color;
    if (value < 40)       color = "#ef4444";     // red-500
    else if (value < 70)  color = "#facc15";     // yellow-400
    else                  color = "#22c55e";     // green-500

    ring.style.setProperty("--progress", value);
    ring.style.setProperty("--color", color);

    percentEl.textContent = value;

    ring.classList.remove("animate-pulse-once");
    void ring.offsetWidth;
    ring.classList.add("animate-pulse-once");
}