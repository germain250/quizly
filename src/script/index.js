const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
    navbar.classList.add("bg-surface/70", "dark:bg-surface-dark/70", "backdrop-blur-3xl", "border-b", "border-primary/20", "shadow-lg");
    navbar.classList.remove("bg-transparent", "backdrop-blur-0");
    } else {
    navbar.classList.remove("bg-surface/70", "dark:bg-surface-dark/70", "backdrop-blur-xl", "border-b", "border-primary/20", "shadow-lg");
    navbar.classList.add("bg-transparent", "backdrop-blur-0");
    }
});

const words = ["Smart Quizzes","True / False Questions","Multiple Choice Learning","Finance & Psychometric Tests","Amategeko y’umuhanda"];
let wordIndex = 0, charIndex = 0, isDeleting = false;
const typeTarget = document.getElementById("typewriter");
function typeEffect(){
    const current = words[wordIndex];
    if(!isDeleting){
    typeTarget.textContent = current.slice(0,charIndex++);
    if(charIndex > current.length){
        isDeleting = true;
        setTimeout(typeEffect, 1200);
        return;
    }
    } else {
    typeTarget.textContent = current.slice(0,charIndex--);
    if(charIndex < 0){
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        charIndex = 0;
    }
    }
    setTimeout(typeEffect, isDeleting ? 80 : 200);
}
typeEffect();

const themeToggle = document.getElementById("themeToggle");
function setTheme(mode){
    if(mode === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme",mode);
    document.querySelector('#themeToggle i.fa-sun').classList.toggle('hidden', mode !== 'dark');
    document.querySelector('#themeToggle i.fa-moon').classList.toggle('hidden', mode === 'dark');
}
const savedTheme = localStorage.getItem("theme") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");
setTheme(savedTheme);
themeToggle.addEventListener("click", ()=>{
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
});

document.querySelectorAll('.quiz-card').forEach(card => {
    card.addEventListener('click', () => {
    card.classList.add('ring-4', 'ring-primary/50');
    setTimeout(() => card.classList.remove('ring-4', 'ring-primary/50'), 1500);
    });
});

const counter = document.getElementById('counter');
let count = 0;
const target = 1247;
const increment = Math.ceil(target / 100);
const timer = setInterval(() => {
    count += increment;
    if (count >= target) {
    count = target;
    clearInterval(timer);
    }
    counter.textContent = count.toLocaleString();
}, 30);