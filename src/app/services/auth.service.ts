import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, get, set, child } from 'firebase/database';
import { User } from '../models/user.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    onAuthStateChanged(this.firebaseService.auth, async (fbUser) => {
      if (fbUser) {
        try {
          await this.loadUserProfile(fbUser.uid);
        } catch (e) {
          console.error('Error loading profile on auth state change:', e);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async loadUserProfile(uid: string): Promise<User | null> {
    const dbRef = ref(this.firebaseService.database);
    const snapshot = await get(child(dbRef, `users/${uid}`));
    if (snapshot.exists()) {
      const userData = snapshot.val() as User;
      if (!userData.active) {
        await signOut(this.firebaseService.auth);
        this.currentUserSubject.next(null);
        throw new Error('Account is disabled by administrator.');
      }
      this.currentUserSubject.next(userData);
      return userData;
    }
    return null;
  }

  async login(email: string, pass: string): Promise<User> {
    try {
      const cred = await signInWithEmailAndPassword(this.firebaseService.auth, email, pass);
      const user = await this.loadUserProfile(cred.user.uid);
      if (!user) {
        throw new Error('User profile not found in database.');
      }
      return user;
    } catch (error: any) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  async register(
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    age: number,
    photoUrl: string,
    role: 'user' | 'admin' = 'user'
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
        role,
        active: true,
        createdAt: Date.now()
      };

      const dbRef = ref(this.firebaseService.database, `users/${uid}`);
      await set(dbRef, newUser);
      this.currentUserSubject.next(newUser);
      return newUser;
    } catch (error: any) {
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

  private getFriendlyErrorMessage(error: any): string {
    const code = error?.code || '';
    const message = error?.message || '';

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
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Invalid email or password.';
    }
    return error.message || 'An authentication error occurred.';
  }
}
