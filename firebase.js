import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHVxJ6hurrvoY4CitwbhXOqvrcEiTqnmw",
  authDomain: "the-authenticity-compass.firebaseapp.com",
  projectId: "the-authenticity-compass",
  storageBucket: "the-authenticity-compass.firebasestorage.app",
  messagingSenderId: "248947738681",
  appId: "1:248947738681:web:dc36a44d9135f5086865e8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// persist auth with AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export { auth, app };
