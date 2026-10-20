import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonSpinner,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonButtons, IonIcon
} from '@ionic/angular';
import { Router } from '@angular/router';
import { MatchingService, MovieRecommendation } from '../../services/matching.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { addIcons } from 'ionicons';
import { arrowBack, heartOutline, filmOutline } from 'ionicons/icons';

@Component({
  selector: 'app-matching',
  templateUrl: './matching.page.html',
  styleUrls: ['./matching.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonButtons, IonIcon
  ]
})
export class MatchingPage implements OnInit {
  recommendations: MovieRecommendation[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly matchingService: MatchingService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    addIcons({ arrowBack, heartOutline, filmOutline });
  }

  ngOnInit(): void {
    void this.loadRecommendations();
  }

  async loadRecommendations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        await this.router.navigate(['/login']);
        return;
      }

      this.recommendations = await this.matchingService.findRecommendations(user);
    } catch (error) {
      console.error('Movie recommendations failed:', error);
      this.errorMessage = 'Recommendations could not be loaded. Check your connection and try again.';
    } finally {
      this.isLoading = false;
    }
  }

  retry(): void {
    void this.loadRecommendations();
  }

  viewDetails(movie: Movie): void {
    void this.router.navigate(['/film-details', movie.id], { state: { movie } });
  }

  goBack(): void { void this.router.navigate(['/home']); }
}
