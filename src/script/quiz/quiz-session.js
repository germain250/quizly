import { generateId, now } from "../core/utils";

export function createQuizSession({ category,questions }){
    return {
        id: generateId("quiz"),
        category,
        timer: {
            duration: questions.length * 60,
            remaining: questions.length * 60,
            startedAt: now(),
            intervalId: null
        },
        questions,
        currentIndex: 0,
        answers: {},
        skipped: new Set(),
        stats: {
            correct: 0,
            wrong: 0,
            skipped: 0
        }
    };
}

export function getCurrentQuestion(session) {
    return session.questions[session.currentIndex]
}

export function answerQuestion(session, questionId, answer){
    session.answers[questionId] = answer;
}

export function nextQuestion(session){
    if (session.currentIndex < session.questions.length -1){
        session.currentIndex++;
    }
}

export function prevQuestion(session) {
    if(session.currentIndex>0){
        session.currentIndex--;
    }
}