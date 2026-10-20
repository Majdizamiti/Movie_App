import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp({ databaseURL: 'https://movieapp-e5b82-default-rtdb.firebaseio.com' });

interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  photoUrl: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: number;
}

async function requireAdmin(uid?: string): Promise<string> {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to continue.');
  const snapshot = await getDatabase().ref(`users/${uid}`).get();
  const actor = snapshot.val() as UserProfile | null;
  if (!actor || actor.role !== 'admin' || actor.active !== true) {
    throw new HttpsError('permission-denied', 'Administrator access is required.');
  }
  return uid;
}

function requiredString(value: unknown, field: string, maxLength = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

export const createManagedUser = onCall(async request => {
  await requireAdmin(request.auth?.uid);
  const firstName = requiredString(request.data?.firstName, 'First name');
  const lastName = requiredString(request.data?.lastName, 'Last name');
  const email = requiredString(request.data?.email, 'Email', 254).toLowerCase();
  const password = requiredString(request.data?.password, 'Password', 128);
  const age = Number(request.data?.age);
  if (password.length < 8) throw new HttpsError('invalid-argument', 'Password must contain at least 8 characters.');
  if (!Number.isInteger(age) || age < 13 || age > 120) throw new HttpsError('invalid-argument', 'Age must be between 13 and 120.');

  const auth = getAuth();
  const account = await auth.createUser({ email, password, displayName: `${firstName} ${lastName}` });
  const profile: UserProfile = {
    uid: account.uid, firstName, lastName, age, email,
    photoUrl: '', role: 'user', active: true, createdAt: Date.now()
  };
  try {
    await getDatabase().ref(`users/${account.uid}`).set(profile);
  } catch (error) {
    await auth.deleteUser(account.uid);
    throw new HttpsError('internal', 'The account profile could not be saved. The account creation was rolled back.');
  }
  return { uid: account.uid };
});

export const updateManagedUser = onCall(async request => {
  await requireAdmin(request.auth?.uid);
  const uid = requiredString(request.data?.uid, 'User ID', 128);
  const changes: Record<string, unknown> = {};
  for (const field of ['firstName', 'lastName', 'photoUrl'] as const) {
    if (request.data?.[field] !== undefined) {
      changes[field] = requiredString(request.data[field], field, field === 'photoUrl' ? 2048 : 160);
    }
  }
  if (request.data?.age !== undefined) {
    const age = Number(request.data.age);
    if (!Number.isInteger(age) || age < 13 || age > 120) throw new HttpsError('invalid-argument', 'Age must be between 13 and 120.');
    changes.age = age;
  }
  let previousEmail: string | undefined;
  if (request.data?.email !== undefined) {
    const email = requiredString(request.data.email, 'Email', 254).toLowerCase();
    previousEmail = (await getAuth().getUser(uid)).email;
    await getAuth().updateUser(uid, { email });
    changes.email = email;
  }

  if (Object.keys(changes).length === 0) {
    throw new HttpsError('invalid-argument', 'Provide at least one profile field to update.');
  }

  try {
    await getDatabase().ref(`users/${uid}`).update(changes);
  } catch (error) {
    if (previousEmail) {
      await getAuth().updateUser(uid, { email: previousEmail }).catch(rollbackError => {
        console.error('Could not roll back the Authentication email update:', rollbackError);
      });
    }
    throw new HttpsError('internal', 'The profile could not be updated. Any Authentication email change was rolled back.');
  }

  return { uid };
});

export const setManagedUserEnabled = onCall(async request => {
  const adminUid = await requireAdmin(request.auth?.uid);
  const uid = requiredString(request.data?.uid, 'User ID', 128);
  const enabled = request.data?.enabled;
  if (typeof enabled !== 'boolean') throw new HttpsError('invalid-argument', 'Enabled must be a boolean.');
  if (uid === adminUid && !enabled) throw new HttpsError('failed-precondition', 'You cannot disable your own administrator account.');

  const auth = getAuth();
  const previous = await auth.getUser(uid);
  await auth.updateUser(uid, { disabled: !enabled });
  try {
    await getDatabase().ref(`users/${uid}`).update({ active: enabled });
  } catch (error) {
    await auth.updateUser(uid, { disabled: previous.disabled });
    throw new HttpsError('internal', 'Could not update the user profile. The Authentication change was rolled back.');
  }
  return { uid, enabled };
});
