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
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROGETTO.firebaseapp.com",
  projectId: "INSERISCI_PROGETTO",
  storageBucket: "INSERISCI_PROGETTO.appspot.com",
  messagingSenderId: "INSERISCI_SENDER_ID",
  appId: "INSERISCI_APP_ID",
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
