import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBkIb35FxHGZZt_Y-wa8JMg9hr1BqarieY",
  authDomain: "quote-test-cd354.firebaseapp.com",
  projectId: "quote-test-cd354",
  storageBucket: "quote-test-cd354.firebasestorage.app",
  messagingSenderId: "400336314554",
  appId: "1:400336314554:web:3a6275d1c39d12777be283"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;

// Log successful initialization
console.log('🔥 Firebase initialized successfully!');
console.log('📊 Project ID:', firebaseConfig.projectId);