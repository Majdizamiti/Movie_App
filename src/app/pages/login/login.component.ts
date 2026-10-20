import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonCard, IonCardHeader, IonCardContent,
  IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonInputPasswordToggle, IonSpinner
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { filmOutline, mailOutline, lockClosedOutline, checkmarkCircleOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonCard, IonCardHeader, IonCardContent,
    IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonInputPasswordToggle, IonSpinner
  ]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  email = '';
  password = '';
  errorMessage = '';
  isLoggingIn = false;

  constructor() {
    addIcons({ filmOutline, mailOutline, lockClosedOutline, checkmarkCircleOutline, arrowForwardOutline });
  }

  async onLogin() {
    if (this.isLoggingIn) return;

    (document.activeElement as HTMLElement)?.blur();
    this.isLoggingIn = true;
    try {
      this.errorMessage = '';
      if (!this.email.trim() || !this.password) {
        this.errorMessage = 'Enter your email address and password.';
        return;
      }
      const user = await this.authService.login(this.email, this.password);
      if (user.role === 'admin') {
        await this.router.navigate(['/admin']);
      } else {
        await this.router.navigate(['/home']);
      }
    } catch (error: unknown) {
      this.errorMessage = error instanceof Error ? error.message : 'Login failed. Please check credentials.';
    } finally {
      this.isLoggingIn = false;
    }
  }
}
