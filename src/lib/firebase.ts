import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const firebaseApp = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
});

// Pass custom firestore database ID if present in the config
export const auth = getAuth(firebaseApp);
export const db = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true,
}, config.firestoreDatabaseId || "(default)");
