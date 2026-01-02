const STORAGE_KEYS = {
    USERS: "quizly_users",
    SESSION: "quizly_current_user"
};

export function getUsers(){
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || {};
}

export function saveUsers(users){
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUserId(){
    return localStorage.getItem(STORAGE_KEYS.SESSION)
}
export function setCurrentUserId(userId){
    localStorage.setItem(STORAGE_KEYS.SESSION, userId)
}

export function clearSession(){
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}