import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBFAQO_1bfm4DaaCrLkyXRgxvNkqPB76HE",
  authDomain: "ballers-c59c7.firebaseapp.com",
  projectId: "ballers-c59c7",
  storageBucket: "ballers-c59c7.firebasestorage.app",
  messagingSenderId: "600822989511",
  appId: "1:600822989511:web:d1884f71d343a8fdeb34e2"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)