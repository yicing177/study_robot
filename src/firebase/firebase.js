// src/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCGjCb6y-3_gvAGPJVDVmDM4EmZ226VuNA",
    authDomain: "project-771d3.firebaseapp.com",
    projectId: "project-771d3",
    storageBucket: "project-771d3.appspot.com", 
    messagingSenderId: "745736050770",
    appId: "1:745736050770:web:7b926b93375c6e59f2678b",
    measurementId: "G-5PPK6CZFSC"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase 服務
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// 匯出 Firebase 服務
export { app, auth, db, analytics };
