# Dashboard Allenamento — Istruzioni per metterla online

Questa è la tua dashboard di allenamento, pronta per essere pubblicata online gratuitamente e condivisa con il tuo personal trainer.

## Passo 1 — Crea il progetto Firebase (5 minuti, gratis)

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e accedi con un account Google
2. Clicca **"Aggiungi progetto"**, dai un nome (es. "dashboard-allenamento"), continua e crea il progetto (puoi disattivare Google Analytics, non serve)
3. Una volta dentro il progetto, nel menu a sinistra vai su **"Build" → "Firestore Database"**
4. Clicca **"Crea database"**, scegli una location vicina a te (es. `eur3 (europe-west)`), e seleziona **"Avvia in modalità test"** (poi sistemiamo le regole di sicurezza)
5. Torna alla pagina principale del progetto (icona casetta), clicca sull'icona **`</>`** ("Aggiungi app web")
6. Dai un nickname all'app (es. "dashboard-web") e clicca "Registra app"
7. Ti mostrerà un blocco di codice chiamato `firebaseConfig` — **copialo**, ti serve nel prossimo passo

## Passo 2 — Inserisci la configurazione Firebase nel progetto

Apri il file `src/firebase.js` e sostituisci questa parte:

```js
const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROGETTO.firebaseapp.com",
  projectId: "INSERISCI_PROGETTO",
  storageBucket: "INSERISCI_PROGETTO.appspot.com",
  messagingSenderId: "INSERISCI_SENDER_ID",
  appId: "INSERISCI_APP_ID",
};
```

con i valori reali copiati da Firebase al passo 1.7.

## Passo 3 — Sistema le regole di sicurezza di Firestore

Nella Firebase Console, vai su **Firestore Database → Regole** e sostituisci il contenuto con questo (permette lettura/scrittura solo al documento della dashboard, senza esporre tutto il progetto):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboard/main {
      allow read, write: if true;
    }
  }
}
```

> Nota: questo rende i dati leggibili/scrivibili da chiunque conosca il link del sito — va benissimo per condividere con il tuo PT, ma non metterci dati sensibili oltre ad allenamento/peso/misure. Se in futuro vuoi più sicurezza, si può aggiungere un login.

Clicca **"Pubblica"**.

## Passo 3bis — Attiva Firebase Storage (per la sezione Foto)

1. Nella Firebase Console, menu a sinistra → **"Databases & Storage" → "Storage"**
2. Clicca **"Get started"**, scegli la stessa location usata per Firestore
3. Vai sulla tab **"Regole"** (Rules) di Storage e sostituisci con:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /progress-photos/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. Clicca **"Pubblica"**

> Stessa nota di prima: questo rende le foto accessibili a chiunque abbia il link del sito — va bene per condividere col PT, ma non è un sistema con login/password.

## Passo 4 — Pubblica il sito su Netlify (gratis)

**Opzione più semplice (drag & drop, senza GitHub):**

1. Sul tuo computer, apri il terminale dentro la cartella del progetto ed esegui:
   ```
   npm install
   npm run build
   ```
   Questo crea una cartella `dist/` con il sito pronto.
2. Vai su [app.netlify.com/drop](https://app.netlify.com/drop)
3. Trascina la cartella `dist` dentro la pagina
4. In pochi secondi avrai un link pubblico tipo `https://nome-a-caso.netlify.app`
5. (Opzionale) Da Netlify puoi rinominare il sito in qualcosa come `dashboard-marco.netlify.app`

## Passo 5 — Condividi il link

Manda il link al tuo personal trainer. Potrà vedere i tuoi progressi (peso, allenamenti, misure) aggiornati in tempo reale ogni volta che li inserisci tu — o anche lui, se vuoi che possa aggiungere dati direttamente.

---

## Aggiornare il sito in futuro

Se modifichi il codice (es. cambi i carichi di default nelle schede), ripeti il Passo 4: `npm run build`, poi trascina di nuovo la cartella `dist` su Netlify (sostituirà il sito esistente con lo stesso link).

## Hai bisogno di aiuto con uno di questi passaggi?

Se ti blocchi su un passaggio specifico, torna in chat con Claude e descrivi cosa vedi a schermo — la procedura puo' variare leggermente nel tempo se Google o Netlify aggiornano l'interfaccia.
