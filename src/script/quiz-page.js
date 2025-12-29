import { createQuizSession } from "./quiz/quiz-session";


const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

profileBtn.addEventListener("click", () => {
    profileMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
    profileMenu.classList.add("hidden");
    }
});

let quizSession = null;

async function loadQuestions(category, count) {
    const res = await fetch("../src/data/questionBank.json");
    const data = await res.json();
    
    const categoryData = data.categories.find(c => c.id === category);
    if(!categoryData) throw new Error("Category not found");

    const shuffled = [...categoryData.questions]
    .sort(()=> Math.random()-0.5)
    .slice(0,count);

    return shuffled;
}

const settingsForm = document.getElementById("quizSettingsForm");

settingsForm.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const [categorySelect, countInput] = settingsForm.querySelectorAll("select, input");

    const category = categorySelect.value;
    const count = countInput.value;

    const questions = await loadQuestions(category, count);

    quizSession = createQuizSession({ category, questions });
    startTimer();

    document.getElementById("quizCategory").textContent = category;
    document.getElementById("totalQuestions").textContent = questions.length;

    renderQuestion();
    document.getElementById("quizSettingsModal").classList.add("hidden");
});

function renderQuestion(){
    const q = quizSession.questions[quizSession.currentIndex];

    document.getElementById("currentIndex").textContent = quizSession.currentIndex + 1;
    document.getElementById("questionText").textContent = q.question;

    const container = document.getElementById("optionsContainer");
    container.innerHTML = "";

    q.options.forEach(option => {
        const label = document.createElement("label");
        label.className = "cursor-pointer";

        label.innerHTML = `
            <div class="flex items-center p-4 rounded-2xl border-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition">
                <input type="radio" name="answer" class="radio radio-primary mr-4">
                <span class="text-lg">${option}</span>
            </div>
        `;
        label.querySelector("input").addEventListener("change",() =>{
            quizSession.answers[q.id] = option;
        });

        container.appendChild(label);
        
    });

    updateProgress();
}

function updateProgress(){
    const percent = ((quizSession.currentIndex + 1) / quizSession.questions.length) * 100;
    document.getElementById("progressBar").value = percent;
}

document.getElementById("nextBtn").addEventListener("click",()=>{
    if(!quizSession) return;
    if(quizSession.currentIndex < quizSession.questions.length -1){
        quizSession.currentIndex ++;
        renderQuestion();
    } else{
        endQuiz();
    }
});

document.getElementById("prevBtn").addEventListener("click",()=>{
    if(!quizSession) return;
    if(quizSession.currentIndex > 0){
        quizSession.currentIndex--;
        renderQuestion();
    }
});

function startTimer(){
    quizSession.timer.startedAt = Date.now();

    quizSession.timer.intervalId = setInterval(() => {
        quizSession.timer.remaining--;
        
        updateTimerUI();

        if(quizSession.timer.remaining <=0){
            stopTimer();
            endQuiz(true);
        }
    }, 1000);
}

function updateTimerUI(){
    const mins = Math.floor(quizSession.timer.remaining / 60);
    const secs = quizSession.timer.remaining % 60;

    document.getElementById("timeRemaining").textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2,"0")}`;
}

function stopTimer(){
    clearInterval(quizSession.timer.intervalId);
}

function endQuiz(timeUp = false){
    stopTimer();

    quizSession.endedAt = Date.now();
    quizSession.timeUp = timeUp;

    quizSession.result = scoreQuiz(quizSession);

    window.location.href = "./quiz_result.html";
}

function scoreQuiz(session) {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    session.questions.forEach(q=> {
        const userAnswer = session.answers[q.id];
        if(!userAnswer){
            skipped ++;
        } else if (userAnswer === q.answer){
            correct ++;
        } else{
            incorrect++;
        }
    });

    const total = session.questions.length;
    const percentage = Math.round((correct/total) * 100)

    return {
        totalQuestions: total,
        correct,
        incorrect,
        skipped,
        percentage
    }
}