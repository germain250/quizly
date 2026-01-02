import { createQuizSession } from "./quiz/quiz-session";
import { isAuthenticated, requireAuth } from "./core/auth_guard";
import { getUsers, saveUsers } from "./core/storage";


let quizSession = null;
let user = null;

const correctSound = new Audio("../sounds/success.mp3");
const wrongSound = new Audio("../sounds/wrong.mp3");

function playCorrect() {
    correctSound.currentTime = 0;
    correctSound.play();
}

function playWrong() {
    wrongSound.currentTime = 0;
    wrongSound.play();
}

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const authButtons = document.getElementById("authButtons");

if (isAuthenticated()) {
    user = requireAuth();
    profileBtn.textContent = user.profile.username[0].toUpperCase();
    authButtons.classList.add("hidden");
} else {
    profileBtn.classList.add("hidden");
}

profileBtn.addEventListener("click", () =>
    profileMenu.classList.toggle("hidden")
);

document.addEventListener("click", e => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add("hidden");
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const retry = sessionStorage.getItem("quizRetry");

    if (retry) {
        handleRetry(JSON.parse(retry));
    } else {
        document.getElementById("quizSettingsModal").classList.remove("hidden");
    }
});

function handleRetry(retry) {
    sessionStorage.removeItem("quizRetry");

    quizSession = createQuizSession({
        category: retry.category,
        questions: retry.questions
    });

    quizSession.liveFeedbackEnabled = retry.liveFeedbackEnabled ?? false;

    if (retry.timeLimit) {
        quizSession.timer.duration = retry.timeLimit;
        quizSession.timer.remaining = retry.timeLimit;
    }

    document.getElementById("quizCategory").textContent = retry.category;
    document.getElementById("totalQuestions").textContent = retry.questions.length;

    document.getElementById("quizSettingsModal").classList.add("hidden");

    startTimer();
    renderQuestion();
}

async function loadQuestions(category, count) {
    const res = await fetch("../src/data/questionBank.json");
    const data = await res.json();

    const cat = data.categories.find(c => c.id === category);
    if (!cat) throw new Error("Category not found");

    return [...cat.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
}
document.getElementById("quizSettingsForm").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.target;
    const category = form.querySelector("select").value;
    const count = Number(form.querySelector('input[type="number"]').value);
    const liveFeedbackEnabled = form.querySelector("#liveFeedbackToggle").checked;

    if (!category || !count) {
        alert("Invalid quiz configuration");
        return;
    }

    const questions = await loadQuestions(category, count);

    quizSession = createQuizSession({ category, questions });
    quizSession.liveFeedbackEnabled = liveFeedbackEnabled;

    document.getElementById("quizCategory").textContent = category;
    document.getElementById("totalQuestions").textContent = questions.length;
    document.getElementById("quizSettingsModal").classList.add("hidden");

    startTimer();
    renderQuestion();
});

function renderQuestion() {
    if (!quizSession) return;

    const q = quizSession.questions[quizSession.currentIndex];
    const entry = quizSession.answers[q.id];

    // Only shuffle once per question
    if (!q.shuffledOptions) {
        q.shuffledOptions = [...q.options];
        for (let i = q.shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.shuffledOptions[i], q.shuffledOptions[j]] = [q.shuffledOptions[j], q.shuffledOptions[i]];
        }
    }

    const optionsToRender = q.shuffledOptions;

    document.getElementById("currentIndex").textContent = quizSession.currentIndex + 1;
    document.getElementById("questionText").textContent = q.question;
    document.getElementById("difficulty").textContent=`(${q.difficulty})`;


    const container = document.getElementById("optionsContainer");
    container.innerHTML = "";

    optionsToRender.forEach(option => {
        const label = document.createElement("label");
        label.className = "cursor-pointer block";

        label.innerHTML = `
            <div class="option flex items-center p-4 rounded-2xl border-2 border-primary/30 transition-all duration-300">
                <input type="radio" name="answer"
                    class="radio radio-primary mr-4"
                    value="${option}">
                <span class="text-lg">${option}</span>
            </div>
        `;

        const radio = label.querySelector("input");
        const wrapper = label.querySelector(".option");

        if (entry) radio.disabled = true;
        if (entry?.value === option) radio.checked = true;

        if (entry && quizSession.liveFeedbackEnabled) {
            if (option === entry.value) {
                if(entry.isCorrect){
                    wrapper.classList.add("border-green-500", "bg-green-500/10", "animate-pulse");
                } else {
                    wrapper.classList.add("border-red-500", "bg-red-500/10", "animate-shake");
                }
            }
            if (!entry.isCorrect && option === q.answer) {
                wrapper.classList.add("border-green-500","bg-green-500/5");
            }
        }

        radio.addEventListener("change", () => {
            const isCorrect = option === q.answer;

            quizSession.answers[q.id] = {
                value: option,
                isCorrect: isCorrect
            };

            if (quizSession.liveFeedbackEnabled) {
                isCorrect ? playCorrect() : playWrong();
            }

            renderQuestion();
        });

        container.appendChild(label);
    });

    updateProgress();
}

function updateProgress() {
    const percent =
        ((quizSession.currentIndex + 1) / quizSession.questions.length) * 100;
    document.getElementById("progressBar").value = percent;
}


document.getElementById("nextBtn").addEventListener("click", () => {
    if (quizSession.currentIndex < quizSession.questions.length - 1) {
        quizSession.currentIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
});

document.getElementById("prevBtn").addEventListener("click", () => {
    if (quizSession.currentIndex > 0) {
        quizSession.currentIndex--;
        renderQuestion();
    }
});

function startTimer() {
    quizSession.timer.startedAt = Date.now();
    quizSession.timer.intervalId = setInterval(() => {
        quizSession.timer.remaining--;
        updateTimerUI();

        if (quizSession.timer.remaining <= 0) {
            stopTimer();
            finishQuiz(true);
        }
    }, 1000);
}

function updateTimerUI() {
    const m = Math.floor(quizSession.timer.remaining / 60);
    const s = quizSession.timer.remaining % 60;
    document.getElementById("timeRemaining").textContent =
        `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stopTimer() {
    clearInterval(quizSession.timer.intervalId);
}

function finishQuiz(timeUp = false) {
    stopTimer();

    quizSession.endedAt = Date.now();
    quizSession.timeUp = timeUp;
    quizSession.result = scoreQuiz(quizSession);

    sessionStorage.setItem("quizSession", JSON.stringify(quizSession));

    if (user) {
        const users = getUsers();
        users[user.id].history.push(quizSession);
        saveUsers(users);
    }

    window.location.href = "./quiz_result.html";
}

function scoreQuiz(session) {
    let correct = 0,
        incorrect = 0,
        skipped = 0;

    session.questions.forEach(q => {
        const e = session.answers[q.id];
        if (!e) skipped++;
        else if (e.isCorrect) correct++;
        else incorrect++;
    });

    const total = session.questions.length;
    return {
        totalQuestions: total,
        correct,
        incorrect,
        skipped,
        percentage: Math.round((correct / total) * 100)
    };
}
