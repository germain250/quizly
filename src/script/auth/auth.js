import { getUsers,saveUsers,setCurrentUserId } from "../core/storage";
import { generateId,now } from "../core/utils";

export async function register({username,email,password}){
    const users = await getUsers();

    for(const id in users){
        if(users[id].profile.username === username || users[id].email === email){
            throw new Error("User already exist");
        }
    }
    const userId = generateId("user");

    users[userId] = {
        id: userId,
        profile: {
            username,
            email,
            password,
            createdAt: now()
        },
        preferences: {
            sound: true,
            theme: "dark",
            settings: {
                category: "amategeko-yumuhanda",
                count: 20,
                isLive: false
            }
        },
        stats: {
            totalQuizzes: 0,
            totalQuestions: 0,
            correctAnswers: 0
        },
        history: []
    };

    saveUsers(users);
    setCurrentUserId(userId);
}

export async function login({ username,password }){
    const users = await getUsers();
    for (const id in users){
        if(users[id].profile.username == username && users[id].profile.password === password){
            setCurrentUserId(id)
            return
        }
    }
    throw new Error("Invalid credentials")
}