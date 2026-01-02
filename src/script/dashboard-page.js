import { requireAuth, isAuthenticated } from "./core/auth_guard";
import { categoryFormatter, count, formatter, intervalFormatter } from "./core/utils";

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const currentThemeDisplay = document.getElementById("currentThemeDisplay");
const soundToggle = document.getElementById("soundToggle");

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

const user = requireAuth();
console.log(user)

function initPreferences() {
  if (!user || !user.preferences) return;

  const { theme = "dark", sound = true } = user.preferences;

  document.documentElement.classList.toggle("dark", theme === "dark");
  currentThemeDisplay.textContent = theme === "dark" ? "Dark" : "Light";
  themeIcon.className = theme === "dark" ? "bx bx-moon text-xl" : "bx bx-sun text-xl";
  themeToggleBtn.querySelector("span").textContent = 
    theme === "dark" ? "Switch to Light" : "Switch to Dark";

  soundToggle.checked = sound;
}

themeToggleBtn.addEventListener("click", () => {
  const isCurrentlyDark = document.documentElement.classList.contains("dark");
  const newTheme = isCurrentlyDark ? "light" : "dark";

  document.documentElement.classList.toggle("dark");
  
  currentThemeDisplay.textContent = newTheme === "dark" ? "Dark" : "Light";
  themeIcon.className = newTheme === "dark" ? "bx bx-moon text-xl" : "bx bx-sun text-xl";
  themeToggleBtn.querySelector("span").textContent = 
    newTheme === "dark" ? "Switch to Light" : "Switch to Dark";

  user.preferences.theme = newTheme;
  saveUserPreferences(user);
});

soundToggle.addEventListener("change", () => {
  const newSoundValue = soundToggle.checked;
  user.preferences.sound = newSoundValue;
  saveUserPreferences(user);
});

function saveUserPreferences(user) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    users[userIndex] = user;
    saveUsers(users);
    console.log("Preferences saved:", user.preferences);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initPreferences();
  writeStats();
  fillTable();
});

function writeStats(){
    document.getElementById("profileName").textContent = user.profile.username;
    profileBtn.textContent = user.profile.username[0].toUpperCase();
    document.getElementById("totalNum").textContent = user.history.length;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    user.history.forEach(session => {
        let result = count(session.questions, session)
        correct += result.correct;
        incorrect += result.incorrect;
        skipped += result.skipped
    });

    let total = correct+skipped+incorrect;
    document.getElementById("correctNum").textContent = correct;
    document.getElementById("totalQuestions").textContent = total;
    document.getElementById("averageScore").textContent = `${ total > 0 ? Math.floor(correct/total*100) : '-'}%`

    console.log(correct,incorrect,skipped)

}

function fillTable(){
  paginateData(user.history)
}


const rowsPerPage = 6;
let currentPage = 1;
let totalPages = 1;

function paginateData(data) {
    totalPages = Math.ceil(data.length / rowsPerPage);
    renderPage(currentPage, data);
    renderPaginationControls(data);
}

function renderPage(page, data) {
    const tableBody = document.getElementById("tableBody");
    const mobileContainer = document.getElementById("mobileHistoryContainer");
    tableBody.innerHTML = "";
    if (mobileContainer) mobileContainer.innerHTML = "";

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = data.slice(start, end);

    pageData.forEach(session => {
        // Desktop table row
        const tr = document.createElement("tr");
        tr.className = "border-b border-primary/10 hover:bg-primary/5 dark:hover:bg-primary/10 transition";
        tr.innerHTML = `
          <td class="py-4 px-4 font-mono text-xs">${session.id}</td>
          <td class="py-4 px-4">${categoryFormatter(session.category)}</td>
          <td class="py-4 px-4">${formatter.format(session.timer.startedAt)}</td>
          <td class="py-4 px-4 font-semibold text-success">${session.result.percentage}%</td>
          <td class="py-4 px-4">${intervalFormatter(session.timer.duration - session.timer.remaining)}</td>
          <td class="py-4 px-4">
            <button class="btn btn-ghost text-primary hover:bg-primary/20 px-4 py-1 flex items-center gap-2">
              <i class="bx bx-show text-lg"></i>
              View Results
            </button>
          </td>
        `;
        tr.querySelector("button").addEventListener("click", () => {
          window.location.href = `./quiz_result.html?id=${session.id}`;
        });
        tableBody.appendChild(tr);

        // Mobile card
        if (mobileContainer) {
            const card = document.createElement("div");
            card.className = "bg-surface dark:bg-surface-dark/40 backdrop-blur border border-primary/20 rounded-2xl p-5 shadow-md";
            card.innerHTML = `
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h4 class="font-semibold text-lg">${categoryFormatter(session.category)}</h4>
                  <p class="text-xs opacity-70 font-mono">${session.id}</p>
                </div>
                <span class="text-success font-bold text-lg">${session.result.percentage}%</span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm opacity-80">
                <div>
                  <p class="text-xs uppercase tracking-wide">Date</p>
                  <p class="font-medium">${formatter.format(session.timer.startedAt)}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide">Time Taken</p>
                  <p class="font-medium">${intervalFormatter(session.timer.duration - session.timer.remaining)}</p>
                </div>
              </div>
              <div class="mt-6 flex justify-end">
                <button class="btn btn-ghost text-primary hover:bg-primary/20 px-4 py-1 flex items-center gap-2">
                  <i class="bx bx-show text-lg"></i>
                  View Results
                </button>
              </div>
            `;
            card.querySelector("button").addEventListener("click", () => {
                window.location.href = `./quiz_result.html?id=${session.id}`;
            });
            mobileContainer.appendChild(card);
        }
    });
}

function renderPaginationControls(data) {
    const container = document.getElementById("paginationControls");
    if (!container) return;
    container.innerHTML = "";

    const prev = document.createElement("button");
    prev.textContent = "«";
    prev.disabled = currentPage === 1;
    prev.className = "btn btn-outline border-primary/40 hover:bg-primary/20 px-4 py-2";
    prev.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage, data);
            renderPaginationControls(data);
        }
    });

    const next = document.createElement("button");
    next.textContent = "»";
    next.disabled = currentPage === totalPages;
    next.className = "btn btn-outline border-primary/40 hover:bg-primary/20 px-4 py-2";
    next.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage, data);
            renderPaginationControls(data);
        }
    });

    container.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = i === currentPage ? "btn bg-primary/20 text-primary px-4 py-2" : "btn btn-outline border-primary/40 hover:bg-primary/20 px-4 py-2";
        btn.addEventListener("click", () => {
            currentPage = i;
            renderPage(currentPage, data);
            renderPaginationControls(data);
        });
        container.appendChild(btn);
    }

    container.appendChild(next);
}