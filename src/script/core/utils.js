export function generateId(prefix = "id"){
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

export function now(){
    return new Date().toISOString();
}

export function count(questions, quizSession) {
    let result = { correct: 0, incorrect: 0, skipped: 0 };

    for (const q of questions) {
        const answer = quizSession?.answers?.[q.id]?.isCorrect;
        if (answer === true) result.correct++;
        else if (answer === false) result.incorrect++;
        else result.skipped++;
    }

    return result;
}

export const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day:   'numeric',
  year:  'numeric'
});

export function intervalFormatter(interval){
    return `${String(Math.floor(interval / 60)).padStart(2, "0")}:${String(interval % 60).padStart(2, "0")}`
}

export function categoryFormatter(category){
    return category.split("-").join(" ");
}

export function launchFireworks(duration = 2500) {
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}
