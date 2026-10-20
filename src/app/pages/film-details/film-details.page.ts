import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton, IonButtons, IonIcon, IonBadge,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner
} from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { addIcons } from 'ionicons';
import { arrowBack, heart, heartOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-film-details',
  templateUrl: './film-details.page.html',
  styleUrls: ['./film-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton, IonButtons, IonIcon, IonBadge,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner
  ]
})
export class FilmDetailsPage implements OnInit, OnDestroy {
  movie: Movie | null = null;
  isFav = false;
  isLoading = true;
  errorMessage = '';
  favoriteError = '';
  isUpdatingFavorite = false;
  private favoriteSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowBack, heart, heartOutline });
  }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.favoriteSubscription = this.favoriteService.watchFavorites(user.uid).subscribe(favorites => {
        this.isFav = favorites.some(favorite => favorite.movieId === Number(this.route.snapshot.paramMap.get('id')));
      });
      void this.favoriteService.getFavorites(user.uid).catch(error => {
        console.warn('Favorite status could not be loaded:', error);
      });
    }
    await this.loadMovie();
  }

  ngOnDestroy() {
    this.favoriteSubscription?.unsubscribe();
  }

  async loadMovie() {
    const movieId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
      this.errorMessage = 'This movie could not be found.';
      this.isLoading = false;
      return;
    }

    const navigationMovie = this.router.getCurrentNavigation()?.extras.state?.['movie'] as Movie | undefined;
    if (navigationMovie?.id === movieId) this.movie = navigationMovie;

    this.isLoading = !this.movie;
    this.errorMessage = '';
    try {
      const details = await this.movieService.getMovieDetails(movieId);
      if (details) {
        this.movie = details;
      } else if (!this.movie) {
        this.errorMessage = 'Movie details are unavailable right now.';
      } else {
        this.errorMessage = 'Showing available movie information. Full details could not be loaded.';
      }
    } catch (error) {
      console.error('Unable to load movie details:', error);
      this.errorMessage = this.movie
        ? 'Showing available movie information. Full details could not be loaded.'
        : 'Movie details could not be loaded. Check your connection and try again.';
    } finally {
      this.isLoading = false;
    }

  }

  async toggleFavorite() {
    if (this.isUpdatingFavorite) return;
    const user = this.authService.getCurrentUser();
    if (!user || !this.movie) return;

    const wasFavorite = this.isFav;
    this.isFav = !wasFavorite;
    this.isUpdatingFavorite = true;
    this.favoriteError = '';
    try {
      if (wasFavorite) await this.favoriteService.removeFavorite(user.uid, this.movie.id);
      else await this.favoriteService.addFavorite(user.uid, this.movie);
    } catch (error) {
      console.error('Favorite could not be updated:', error);
      this.isFav = wasFavorite;
      this.favoriteError = 'Favorite could not be updated. Please try again.';
    } finally {
      this.isUpdatingFavorite = false;
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
