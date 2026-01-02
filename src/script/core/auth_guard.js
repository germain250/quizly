import { getCurrentUserId, getUsers } from "./storage";

export function requireAuth(redirect = "./login.html") {
    const userId = getCurrentUserId();

    if (!userId) {
        window.location.href = redirect;
        throw new Error("Unauthorized");
    }

    const users = getUsers();
    const user = users[userId];
    console.log(user)

    if (!user) {
        window.location.href = redirect;
        throw new Error("Invalid User");
    }

    return user;
}

export function isAuthenticated(){
    const userId = getCurrentUserId();
    if(userId){
        return true;
    } else{
        return false;
    }
}