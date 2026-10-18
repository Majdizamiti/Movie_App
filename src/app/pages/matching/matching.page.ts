import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonAvatar, IonBadge, IonButton, IonButtons, IonIcon
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { MatchingService, MatchResult } from '../../services/matching.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBack, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-matching',
  templateUrl: './matching.page.html',
  styles: [''],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonAvatar, IonBadge, IonButton, IonButtons, IonIcon
  ]
})
export class MatchingPage implements OnInit {
  matches: MatchResult[] = [];
  isLoading = true;

  constructor(
    private matchingService: MatchingService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowBack, peopleOutline });
  }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.matches = await this.matchingService.findMatches(user);
    }
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
