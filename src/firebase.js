import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

// ⚠️ Sostituisci questi valori con quelli del TUO progetto Firebase.
// Li trovi su: Firebase Console → Impostazioni progetto → Generali → "Le tue app" → SDK config
const firebaseConfig = {
  apiKey: "AIzaSyAbAnN9NL3Ty7A2X3CtLKOA-VVNlWV76W8",
  authDomain: "dashboard-allenamento.firebaseapp.com",
  projectId: "dashboard-allenamento",
  storageBucket: "dashboard-allenamento.firebasestorage.app",
  messagingSenderId: "261662688344",
  appId: "1:261662688344:web:9c189381b71c98adc2762d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Un solo documento Firestore contiene tutti i dati della dashboard.
// Semplice e sufficiente per un uso personale/condiviso col PT.
const DOC_PATH = ["dashboard", "main"];

export async function loadAllData() {
  const out = { weights: [], workouts: [], measurements: [] };
  try {
    const ref = doc(db, ...DOC_PATH);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      out.weights = data.weights || [];
      out.workouts = data.workouts || [];
      out.measurements = data.measurements || [];
    }
  } catch (e) {
    console.error("Errore caricamento dati da Firestore", e);
  }
  return out;
}

export async function saveField(key, value) {
  try {
    const ref = doc(db, ...DOC_PATH);
    await setDoc(ref, { [key]: value }, { merge: true });
    return true;
  } catch (e) {
    console.error("Errore salvataggio su Firestore", key, e);
    return false;
  }
}
