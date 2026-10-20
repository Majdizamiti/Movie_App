export interface User {
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
