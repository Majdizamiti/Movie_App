import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonInput, IonButton, IonText, IonIcon, IonAvatar, IonButtons, IonInputPasswordToggle, IonList
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CameraService } from '../../services/camera.service';
import { addIcons } from 'ionicons';
import { cameraOutline, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonButton, IonText, IonIcon, IonAvatar, IonButtons, IonInputPasswordToggle, IonList
  ]
})
export class RegisterPage {
  firstName = '';
  lastName = '';
  age: number = 20;
  email = '';
  password = '';
  photoUrl = '';
  errorMessage = '';
  isCapturing = false;

  constructor(
    private authService: AuthService,
    private cameraService: CameraService,
    private router: Router
  ) {
    addIcons({ cameraOutline, arrowBack });
  }

  async takePhoto() {
    try {
      this.isCapturing = true;
      const image = await import('@capacitor/camera').then(m => m.Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: m.CameraResultType.DataUrl,
        source: m.CameraSource.Prompt
      }));
      if (image.dataUrl) {
        this.photoUrl = image.dataUrl;
      }
    } catch (error) {
      console.error('Camera error:', error);
    } finally {
      this.isCapturing = false;
    }
  }

  async onRegister() {
    try {
      this.errorMessage = '';
      if (!this.email || !this.password || !this.firstName || !this.lastName) {
        this.errorMessage = 'Please fill all required fields.';
        return;
      }
      if (this.password.length < 6) {
        this.errorMessage = 'Password must be at least 6 characters long.';
        return;
      }

      const user = await this.authService.register(
        this.email,
        this.password,
        this.firstName,
        this.lastName,
        this.age,
        this.photoUrl || 'https://ionicframework.com/docs/img/demos/avatar.svg'
      );

      if (this.photoUrl && this.photoUrl.startsWith('data:')) {
        const storageRef = await import('firebase/storage').then(async (m) => {
          const sRef = m.ref((this.authService as any).firebaseService.storage, `users/${user.uid}/profile.jpg`);
          await m.uploadString(sRef, this.photoUrl, 'data_url');
          return await m.getDownloadURL(sRef);
        });
        await import('firebase/database').then(async (m) => {
          const dbRef = m.ref((this.authService as any).firebaseService.database, `users/${user.uid}`);
          await m.update(dbRef, { photoUrl: storageRef });
        });
      }

      this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Registration failed.';
    }
  }
}
