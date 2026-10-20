import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, get, set, update, child } from 'firebase/database';
import { User } from '../models/user.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private authReady: Promise<void>;
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.authReady = new Promise<void>((resolve) => {
      onAuthStateChanged(this.firebaseService.auth, async (fbUser) => {
        try {
          if (fbUser) {
            const profile = await this.withTimeout(this.loadUserProfile(fbUser.uid), 8000, null);
            if (!profile) this.currentUserSubject.next(null);
          } else {
            this.currentUserSubject.next(null);
          }
        } catch (e) {
          this.currentUserSubject.next(null);
          console.error('Error loading profile on auth state change:', e);
        } finally {
          resolve();
        }
      });
    });
  }

  waitForAuth(): Promise<void> {
    return this.authReady;
  }

  async loadUserProfile(uid: string): Promise<User | null> {
    const dbRef = ref(this.firebaseService.database);
    const snapshot = await this.withTimeout(get(child(dbRef, `users/${uid}`)), 8000, null);
    if (snapshot?.exists()) {
      const userData = snapshot.val() as User;
      if (!userData.active) {
        await signOut(this.firebaseService.auth);
        this.currentUserSubject.next(null);
        throw new Error('Account is disabled by administrator.');
      }
      this.currentUserSubject.next(userData);
      return userData;
    }
    this.currentUserSubject.next(null);
    return null;
  }

  async login(email: string, pass: string): Promise<User> {
    try {
      const cred = await signInWithEmailAndPassword(this.firebaseService.auth, email, pass);
      const user = await this.loadUserProfile(cred.user.uid);
      if (!user) {
        throw new Error('Your account was authenticated, but its profile could not be loaded. Check your connection and verify that your Firebase Realtime Database contains a users/' + cred.user.uid + ' record.');
      }
      return user;
    } catch (error: unknown) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  async register(
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    age: number,
    photoUrl: string
  ): Promise<User> {
    try {
      if (pass.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const cred = await createUserWithEmailAndPassword(this.firebaseService.auth, email, pass);
      const uid = cred.user.uid;

      const newUser: User = {
        uid,
        firstName,
        lastName,
        age,
        email,
        photoUrl,
        role: 'user',
        active: true,
        createdAt: Date.now()
      };

      const dbRef = ref(this.firebaseService.database, `users/${uid}`);
      await set(dbRef, newUser);
      this.currentUserSubject.next(newUser);
      return newUser;
    } catch (error: unknown) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  async logout(): Promise<void> {
    await signOut(this.firebaseService.auth);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async updatePhotoUrl(uid: string, photoUrl: string): Promise<void> {
    await update(ref(this.firebaseService.database, `users/${uid}`), { photoUrl });
    const currentUser = this.currentUserSubject.value;
    if (currentUser?.uid === uid) this.currentUserSubject.next({ ...currentUser, photoUrl });
  }

  private async withTimeout<T>(promise: Promise<T>, milliseconds: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((resolve) => {
          timer = setTimeout(() => resolve(fallback), milliseconds);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private getFriendlyErrorMessage(error: unknown): string {
    const details = error as { code?: string; message?: string } | null;
    const code = details?.code || '';
    const message = details?.message || '';

    if (code === 'auth/operation-not-allowed' || message.includes('ADMIN_PROJECT_CONFIG_NOT_FOUND') || message.includes('400')) {
      return 'Firebase Authentication Error: Please ensure "Email/Password" sign-in method is enabled in your Firebase Console (Authentication -> Sign-in method), and that your firebaseConfig is valid.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'This email address is already registered by another account.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (message.toLowerCase().includes('timed out')) {
      return 'The account service is taking too long to respond. Check your connection and try again.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Invalid email or password.';
    }
    return message || 'An authentication error occurred.';
  }
}
