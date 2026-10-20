import { Injectable } from '@angular/core';
import { child, get, ref, update } from 'firebase/database';
import { FirebaseService } from './firebase.service';
import { User } from '../models/user.model';

type EditableProfileFields = Partial<Pick<User, 'firstName' | 'lastName' | 'age' | 'photoUrl'>>;

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly firebase: FirebaseService) {}

  async getAllUsers(): Promise<User[]> {
    const snapshot = await get(child(ref(this.firebase.database), 'users'));
    if (!snapshot.exists()) return [];

    return Object.values(snapshot.val() as Record<string, User>);
  }

  async getUser(uid: string): Promise<User | null> {
    const snapshot = await get(ref(this.firebase.database, `users/${uid}`));
    return snapshot.exists() ? snapshot.val() as User : null;
  }

  async updateProfile(uid: string, changes: EditableProfileFields): Promise<void> {
    if (Object.keys(changes).length === 0) return;
    await update(ref(this.firebase.database, `users/${uid}`), changes);
  }
}
