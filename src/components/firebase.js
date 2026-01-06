// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQhzAEuqtUFCyHLgM3IDFRCF51idIHG5U",
  authDomain: "milliy-c2480.firebaseapp.com",
  projectId: "milliy-c2480",
  storageBucket: "milliy-c2480.firebasestorage.app",
  messagingSenderId: "611717737836",
  appId: "1:611717737836:web:1fe26d73c3d645123ad749"
};

// Appni ishga tushirish
const app = initializeApp(firebaseConfig);

// Databaseni eksport qilish
export const db = getFirestore(app);