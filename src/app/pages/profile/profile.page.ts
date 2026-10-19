import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar,
  IonButton, IonButtons, IonIcon, IonCard, IonCardContent,
  IonItem, IonLabel, IonBadge, IonList
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CameraService } from '../../services/camera.service';
import { User } from '../../models/user.model';
import { addIcons } from 'ionicons';
import { arrowBack, cameraOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styles: [''],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar,
    IonButton, IonButtons, IonIcon, IonCard, IonCardContent,
    IonItem, IonLabel, IonBadge, IonList
  ]
})
export class ProfilePage implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cameraService: CameraService,
    private router: Router
  ) {
    addIcons({ arrowBack, cameraOutline, logOutOutline });
  }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
  }

  async updatePhoto() {
    if (!this.user) return;
    try {
      const photoUrl = await this.cameraService.takeAndUploadPhoto(this.user.uid);
      await this.userService.updateProfile(this.user.uid, { photoUrl });
      this.user.photoUrl = photoUrl;
    } catch (error) {
      console.error('Failed to update photo:', error);
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
