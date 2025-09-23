import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBvCipId0uvanpDmXkV8srnkEZleuPrpYE',
  authDomain: 'por-los-animales-maldona-c5cf0.firebaseapp.com',
  projectId: 'por-los-animales-maldona-c5cf0',
  storageBucket: 'por-los-animales-maldona-c5cf0.firebasestorage.app',
  messagingSenderId: '456825657289',
  appId: '1:456825657289:web:fcfab4500014cf78c6ba18',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
