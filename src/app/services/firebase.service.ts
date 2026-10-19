import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "*********",
  authDomain: "movieapp-e5b82.firebaseapp.com",
  databaseURL: "https://movieapp-e5b82-default-rtdb.firebaseio.com",
  projectId: "movieapp-e5b82",
  storageBucket: "movieapp-e5b82.firebasestorage.app",
  messagingSenderId: "818619878478",
  appId: "1:818619878478:web:be35041fea5160faf7871f",
  measurementId: "G-7XFEQFG5XV"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  public app: FirebaseApp;
  public auth: Auth;
  public database: Database;
  public storage: FirebaseStorage;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.database = getDatabase(this.app);
    this.storage = getStorage(this.app);
  }
}
