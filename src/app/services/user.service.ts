import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { ref, get, update, child, set } from 'firebase/database';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firebaseService: FirebaseService) {}

  async getAllUsers(): Promise<User[]> {
    try {
      const dbRef = ref(this.firebaseService.database);
      const snapshot = await get(child(dbRef, 'users'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const users = Object.values(data) as User[];
        localStorage.setItem('movieapp_local_users', JSON.stringify(users));
        return users;
      }
    } catch (error) {
      console.warn('DB getAllUsers permission/network error, falling back to local storage:', error);
    }

    // Fallback to local storage
    const local = localStorage.getItem('movieapp_local_users');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    // Return current user if available
    const currentUserStr = localStorage.getItem('movieapp_local_user');
    if (currentUserStr) {
      try { return [JSON.parse(currentUserStr)]; } catch (e) {}
    }

    return [];
  }

  async updateUserActiveStatus(uid: string, active: boolean): Promise<void> {
    try {
      const userRef = ref(this.firebaseService.database, `users/${uid}`);
      await update(userRef, { active });
    } catch (error) {
      console.warn('DB update status error, updating local storage:', error);
    }

    // Update local storage
    const users = await this.getAllUsers();
    const updated = users.map(u => u.uid === uid ? { ...u, active } : u);
    localStorage.setItem('movieapp_local_users', JSON.stringify(updated));
  }

  async updateProfile(uid: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = ref(this.firebaseService.database, `users/${uid}`);
      await update(userRef, data);
    } catch (error) {
      console.warn('DB update profile error, updating local storage:', error);
    }

    const localUserStr = localStorage.getItem('movieapp_local_user');
    if (localUserStr) {
      try {
        const u = JSON.parse(localUserStr);
        if (u.uid === uid) {
          const updated = { ...u, ...data };
          localStorage.setItem('movieapp_local_user', JSON.stringify(updated));
        }
      } catch (e) {}
    }
  }
}
