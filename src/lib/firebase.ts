// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqDf3Ae_JuH8b9IMwz-pJsh_EKB7hza9Q",
  authDomain: "xeeroo-store.firebaseapp.com",
  databaseURL: "https://xeeroo-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xeeroo-store",
  storageBucket: "xeeroo-store.firebasestorage.app",
  messagingSenderId: "751882362566",
  appId: "1:751882362566:web:27bdc54b01d2683a8281c7",
  measurementId: "G-0VY2GNZYR9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);