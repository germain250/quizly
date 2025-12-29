const STORAGE_KEYS = {
    USERS: "quizly_users",
    SESSION: "quizly_current_user"
};

export async function getUsers(){
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || {};
}

export async function saveUsers(users){
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export async function getCurrentUserId(){
    localStorage.getItem(STORAGE_KEYS.SESSION)
}
export async function setCurrentUserId(userId){
    localStorage.setItem(STORAGE_KEYS.SESSION, userId)
}

export async function clearSession(){
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}