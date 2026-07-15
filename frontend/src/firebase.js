import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCNsGjIT7cSS5hf6X7jxPGkGBCea8uScyc",
  authDomain: "ai-expense-tracker-1a695.firebaseapp.com",
  projectId: "ai-expense-tracker-1a695",
  storageBucket: "ai-expense-tracker-1a695.firebasestorage.app",
  messagingSenderId: "651073678330",
  appId: "1:651073678330:web:75c8039a1c6ee13fd55243"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();