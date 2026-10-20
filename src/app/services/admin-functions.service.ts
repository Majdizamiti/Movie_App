import { Injectable } from '@angular/core';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseService } from './firebase.service';

export interface CreateManagedUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
}

@Injectable({ providedIn: 'root' })
export class AdminFunctionsService {
  private readonly functions;

  constructor(firebase: FirebaseService) {
    this.functions = getFunctions(firebase.app);
  }

  async createUser(input: CreateManagedUserInput): Promise<{ uid: string }> {
    const call = httpsCallable<CreateManagedUserInput, { uid: string }>(this.functions, 'createManagedUser');
    const result = await call(input);
    return result.data;
  }

  async updateUser(input: { uid: string; firstName?: string; lastName?: string; age?: number; email?: string; photoUrl?: string }): Promise<void> {
    const call = httpsCallable<typeof input, { uid: string }>(this.functions, 'updateManagedUser');
    await call(input);
  }

  async setUserEnabled(uid: string, enabled: boolean): Promise<void> {
    const call = httpsCallable<{ uid: string; enabled: boolean }, { uid: string; enabled: boolean }>(this.functions, 'setManagedUserEnabled');
    await call({ uid, enabled });
  }
}
