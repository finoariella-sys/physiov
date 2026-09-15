import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD82WjiktZ5NTVPocP6ACXnkoPUhZYD0T8",
    authDomain: "physiov-249df.firebaseapp.com",
    projectId: "physiov-249df",
    storageBucket: "physiov-249df.firebasestorage.app",
    messagingSenderId: "570185799084",
    appId: "1:570185799084:web:b4981e2add9e8bbad51609"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);