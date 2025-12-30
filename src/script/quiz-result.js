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
let reviewIndex = 0;

document.addEventListener("DOMContentLoaded",()=>{
    loadSession();
    writeStats();
    renderReviewQuestion();
    bindReviewNavigation();
    performanceSection();
})

function loadSession(){
    const stored = sessionStorage.getItem("quizSession");

    if(!stored){
        alert("No quiz session found. Redirecting to dashboard.");
        window.location.href = "dashboard.html";
        return;
    }
    quizSession = JSON.parse(stored);
}

function renderReviewQuestion(){
    const question = quizSession.questions[reviewIndex];
    const userAnswer = quizSession.answers[question.id]

    document.getElementById("reviewCurrent").textContent = reviewIndex + 1;
    document.getElementById("reviewTotal").textContent = quizSession.questions.length;
    document.getElementById("reviewCategory").textContent = quizSession.category;
    document.getElementById("reviewQuestionText").textContent = question.question;
    
    const statusEl = document.getElementById("reviewStatus");
    statusEl.className = "inline-block px-6 py-2 rounded-full text-sm font-semibold";

    if(!userAnswer || userAnswer.selectedIndex == null){
        statusEl.textContent = "Skipped";
        statusEl.classList.add(
            "bg-warning/20",
            "text-warning",
            "border",
            "border-warning/40"
        );
    } else if (userAnswer.isCorrect){
        statusEl.textContent = "Correct";
        statusEl.classList.add(
            "bg-success/20",
            "text-success",
            "border",
            "border-success/40"
        );
    } else{
        statusEl.textContent = "Incorrect";
        statusEl.classList.add(
            "bg-error/20",
            "text-error",
            "border",
            "border-error/40"
        );
    }

    renderReviewOptions(question, userAnswer)
}

function renderReviewOptions(question, userAnswer){
    const optionsContainer = document.getElementById("reviewOptions");
    optionsContainer.innerHTML = "";

    question.options.forEach((option,index) => {
        const isCorrect = index === question.correctIndex;
        const isUserChoice = userAnswer && index === userAnswer.selectedIndex;

        let classes = "flex items-center p-6  rounded-2xl border-2 text-lg font-medium"

        let icon = "";
        let label = "";

        if(isCorrect){
            classes += "border-success bg-success/10";
            icon = "<i class='bx bx-check-circle text-success text-2xl mr-4'></i>";
            label = "<span class='block text-sm opacity-70 mt-1'>Correct answer</span>";
        } else if(isUserChoice && !isCorrect){
            classes += " border-error bg-error/10";
            icon = "<i class='bx bx-x-circle text-error text-2xl mr-4'></i>";
            label = "<span class='block text-sm opacity-70 mt-1'>Your answer</span>";
        } else{
            classes += " border-primary/20 opacity-60";
        }

        const optionEl = document.createElement("div");
        optionEl.className = classes;
        optionEl.innerHTML = `
        ${icon}
        <span>
            ${option}
            ${label}
        </span>
        ` 
        optionsContainer.appendChild(optionEl);
    });
}

function bindReviewNavigation(){
    document.getElementById("reviewNextBtn").addEventListener("click",()=>{
        if (reviewIndex < quizSession.questions.length - 1){
            reviewIndex++;
            renderReviewQuestion();
        }
    });

    document.getElementById("reviewPrevBtn").addEventListener("click",()=>{
        if(reviewIndex > 0){
            reviewIndex--;
            renderReviewQuestion();
        }
    });
}

function writeStats(){
    let time = quizSession.timer.duration - quizSession.timer.remaining
    let timeTaken = `${String(Math.floor(time/ 60)).padStart(2,"0")}:${String(time%60).padStart(2,"0")}`;
    let timeLimit = `${String(Math.floor(quizSession.timer.duration / 60)).padStart(2,"0")}:${String(quizSession.timer.duration%60).padStart(2,"0")}`;

    let percentage = quizSession.result.percentage;


    document.getElementById("correct-num").textContent = quizSession.result.correct;
    document.getElementById("incorrect-num").textContent = quizSession.result.incorrect;
    document.getElementById("correct-numm").textContent = quizSession.result.correct;
    document.getElementById("skipped-num").textContent = quizSession.result.skipped;
    document.getElementById("total-num").textContent = quizSession.result.totalQuestions;
    document.getElementById("total-numm").textContent = quizSession.result.totalQuestions;
    document.getElementById("time-taken").textContent = timeTaken;
    document.getElementById("time-limit").textContent = timeLimit;  
    document.getElementById("percent").textContent = percentage;
    document.getElementById("categoryName").textContent = quizSession.category;

    if(percentage > 80){
        document.getElementById("congrats").textContent = "Excellent!";
    } else if (percentage > 60){
        document.getElementById("congrats").textContent = "Great job!";
    } else if (percentage > 40){
        document.getElementById("congrats").textContent = "More effort";
    } else{
        document.getElementById("congrats").textContent = "Work harder!";
    }

}
function performanceSection(){
    let questions = quizSession.questions;
    let easy = []
    let medium = [];
    let hard = []
    
    for (let i =0; i<questions.length; i++){
        if(questions[i].difficulty === "easy"){
            easy.push(questions[i]);
        } else if (questions[i].difficulty === "medium"){
            medium.push(questions[i])
        } else{
            hard.push(questions[i])
        }
    }
    const hardCorrect = getCorrect(hard);
    const mediumCorrect = getCorrect(medium);
    const easyCorrect = getCorrect(easy);


    console.log("Hard Questions: ", hardCorrect)
    console.log("Medium Questions: ",mediumCorrect)
    console.log("Easy Questions: ", easyCorrect)
    console.log("All Questions: ", questions);
    console.log("Session: ", quizSession)
}

function getCorrect(questions){
    let correct = 0;
    for(let i =0; i<questions.length; i++){
        let questionId = questions[i].id;
        if(questions[i].answer === quizSession.answers[questionId] ){
            correct++
        }
    }
    return correct;
}