// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getDatabase, ref } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7019Jb_PGrJ-0WzGbUtmZ3Nemc6mD7jE",
  authDomain: "new-project-1557054001172.firebaseapp.com",
  databaseURL: "https://new-project-1557054001172.firebaseio.com",
  projectId: "new-project-1557054001172",
  storageBucket: "new-project-1557054001172.appspot.com",
  messagingSenderId: "484549045450",
  appId: "1:484549045450:web:aa145a3d5b106a420a5833",
  measurementId: "G-YEENVKLY8N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const db = getDatabase();
export const dbRef = ref(db);