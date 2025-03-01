import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace these values with your own Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCqkmzvkCRoE6SDIHM58yQa0fMpvaIvnEo",
    authDomain: "visitor-e17d4.firebaseapp.com",
    projectId: "visitor-e17d4",
    storageBucket: "visitor-e17d4.firebasestorage.app",
    messagingSenderId: "287815566228",
    appId: "1:287815566228:web:89b40f958afb4eee104581",
    measurementId: "G-8NNW9SN2PD"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };