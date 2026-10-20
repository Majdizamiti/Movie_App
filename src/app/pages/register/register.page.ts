import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonCard, IonCardHeader, IonCardContent,
  IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonAvatar, IonInputPasswordToggle, IonSpinner
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CameraService } from '../../services/camera.service';
import { addIcons } from 'ionicons';
import { cameraOutline, arrowBack, filmOutline, personOutline, mailOutline, lockClosedOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonCard, IonCardHeader, IonCardContent,
    IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonAvatar, IonInputPasswordToggle, IonSpinner
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
  isRegistering = false;

  constructor(
    private authService: AuthService,
    private cameraService: CameraService,
    private router: Router
  ) {
    addIcons({ cameraOutline, arrowBack, filmOutline, personOutline, mailOutline, lockClosedOutline, arrowForwardOutline });
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
    if (this.isRegistering) return;
    (document.activeElement as HTMLElement)?.blur();
    this.isRegistering = true;
    try {
      this.errorMessage = '';
      if (!this.email || !this.password || !this.firstName || !this.lastName) {
        this.errorMessage = 'Please fill all required fields.';
        return;
      }
      if (!Number.isInteger(Number(this.age)) || this.age < 13 || this.age > 120) {
        this.errorMessage = 'Age must be between 13 and 120.';
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
        this.photoUrl.startsWith('data:') || !this.photoUrl
          ? 'https://ionicframework.com/docs/img/demos/avatar.svg'
          : this.photoUrl
      );

      if (this.photoUrl.startsWith('data:')) {
        const uploadedPhotoUrl = await this.cameraService.uploadDataUrl(user.uid, this.photoUrl);
        await this.authService.updatePhotoUrl(user.uid, uploadedPhotoUrl);
      }

      await this.router.navigate(['/home']);
    } catch (error: unknown) {
      this.errorMessage = error instanceof Error ? error.message : 'Registration failed.';
    } finally {
      this.isRegistering = false;
    }
  }
}
