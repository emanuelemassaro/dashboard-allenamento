import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

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
const storage = getStorage(app);

// Un solo documento Firestore contiene peso/allenamenti/misure.
// Semplice e sufficiente per un uso personale/condiviso col PT.
const DOC_PATH = ["dashboard", "main"];

// Le foto invece usano una collezione separata: ogni foto è un documento
// con { date, url, storagePath }, mentre il file vero vive su Storage.
const PHOTOS_COLLECTION = "photos";

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

// ---------- Foto progressi (Firebase Storage + Firestore) ----------

export async function loadPhotos() {
  try {
    const q = query(collection(db, PHOTOS_COLLECTION), orderBy("date", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Errore caricamento foto", e);
    return [];
  }
}

export async function uploadPhoto(file, date) {
  try {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const path = `progress-photos/${safeName}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), {
      date,
      url,
      storagePath: path,
    });
    return { id: docRef.id, date, url, storagePath: path };
  } catch (e) {
    console.error("Errore upload foto", e);
    return null;
  }
}

export async function deletePhoto(photoId, storagePath) {
  try {
    if (storagePath) {
      try {
        await deleteObject(storageRef(storage, storagePath));
      } catch (e) {
        // se il file su Storage non esiste più, continuiamo comunque
        // a rimuovere il riferimento in Firestore
        console.warn("File Storage non trovato durante l'eliminazione", e);
      }
    }
    await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
    return true;
  } catch (e) {
    console.error("Errore eliminazione foto", e);
    return false;
  }
}
