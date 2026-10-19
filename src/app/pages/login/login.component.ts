import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardContent,
  IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonInputPasswordToggle
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { filmOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardContent,
    IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonInputPasswordToggle
  ]
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ filmOutline });
  }

  async onLogin() {
    (document.activeElement as HTMLElement)?.blur();
    try {
      this.errorMessage = '';
      const user = await this.authService.login(this.email, this.password);
      if (user.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed. Please check credentials.';
    }
  }
}
