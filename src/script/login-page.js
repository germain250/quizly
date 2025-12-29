import { register,login } from "./auth/auth";

const loginForm = document.querySelector("#loginForm form");
const registerForm = document.querySelector("#registerForm form");
const loginError = loginForm.querySelector(".form-error");
const registerError = registerForm.querySelector(".form-error");

loginForm.addEventListener("submit", async e=> {
    e.preventDefault();

    const username = loginForm.querySelector("input[type=text]").value;
    const password = loginForm.querySelector("input[type=password]").value;

    try {
        login({username,password});
        window.location.href = "./dashboard.html";
    } catch (error) {
        loginError.textContent = err.message;
    }
});

registerForm.addEventListener("submit", async e=> {
    e.preventDefault();

    const inputs = registerForm.querySelectorAll("input");
    const [username,email,password] = [...inputs].map(i=>i.value);

    try {
        await register({username,email,password})
        window.location.href = './dashboard.html'
    } catch (error) {
        registerError.textContent = error.message
    }
})