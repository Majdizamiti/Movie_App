import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonButton, IonButtons, IonIcon, IonSearchbar, IonSkeletonText
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { FavoriteService } from '../services/favorite.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.model';
import { addIcons } from 'ionicons';
import { heart, heartOutline, people, peopleOutline, person, personCircleOutline, settings, settingsOutline, play, arrowForwardOutline, filmOutline, search } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonButton, IonButtons, IonIcon, IonSearchbar, IonSkeletonText
  ]
})
export class HomePage implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = true;
  hasLoadError = false;
  loadErrorMessage = '';
  private searchTimer?: ReturnType<typeof setTimeout>;
  private searchRequestId = 0;
  searchQuery = '';
  favoriteIds: Set<number> = new Set();
  readonly pendingFavoriteIds = new Set<number>();
  favoriteError = '';
  private favoriteSubscription?: Subscription;
  private favoriteUid = '';

  constructor(
    private movieService: MovieService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ heart, heartOutline, people, peopleOutline, person, personCircleOutline, settings, settingsOutline, play, arrowForwardOutline, filmOutline, search });
  }

  async ngOnInit() {
    await this.loadMovies();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchRequestId++;
    this.favoriteSubscription?.unsubscribe();
  }

  ionViewWillEnter() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.favoriteSubscription?.unsubscribe();
      this.favoriteSubscription = undefined;
      this.favoriteUid = '';
      this.favoriteIds.clear();
      return;
    }
    if (this.favoriteUid !== user.uid) {
      this.favoriteSubscription?.unsubscribe();
      this.favoriteUid = user.uid;
      this.favoriteSubscription = this.favoriteService.watchFavorites(user.uid).subscribe(favorites => {
        this.favoriteIds = new Set(favorites.map(favorite => favorite.movieId));
      });
    }
    void this.loadFavorites();
  }

  async loadMovies() {
    const requestId = ++this.searchRequestId;
    this.isLoading = true;
    this.hasLoadError = false;
    this.loadErrorMessage = '';
    try {
      const movies = await this.movieService.getPopularMovies();
      if (requestId === this.searchRequestId) this.movies = movies;
      if (requestId === this.searchRequestId && movies.length === 0) {
        this.hasLoadError = true;
        this.loadErrorMessage = 'No movies were returned. Check your connection and try again.';
      }
    } catch (error) {
      console.error('Unable to load movies:', error);
      if (requestId === this.searchRequestId) {
        this.hasLoadError = true;
        this.loadErrorMessage = 'Movies could not be loaded. Check your internet connection and retry.';
        this.movies = [];
      }
    } finally {
      if (requestId === this.searchRequestId) this.isLoading = false;
    }
  }

  async loadFavorites() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    try {
      const favs = await this.favoriteService.getFavorites(user.uid);
      if (this.pendingFavoriteIds.size === 0) {
        this.favoriteIds = new Set(favs.map(favorite => favorite.movieId));
      }
    } catch (error) {
      console.warn('Favorites could not be loaded:', error);
    }
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const requestId = ++this.searchRequestId;
    const query = this.searchQuery.trim();
    if (!query) {
      void this.loadMovies();
      return;
    }

    this.searchTimer = setTimeout(async () => {
      this.isLoading = true;
      this.hasLoadError = false;
      this.loadErrorMessage = '';
      try {
        const results = await this.movieService.searchMovies(query);
        if (requestId === this.searchRequestId) this.movies = results;
      } catch (error) {
        console.error('Movie search failed:', error);
        if (requestId === this.searchRequestId) {
          this.movies = [];
          this.hasLoadError = true;
          this.loadErrorMessage = 'Search is temporarily unavailable. Check your connection and retry.';
        }
      } finally {
        if (requestId === this.searchRequestId) this.isLoading = false;
      }
    }, 180);
  }

  retryMovies() {
    if (this.searchQuery.trim()) this.onSearch();
    else void this.loadMovies();
  }

  isFavorite(movieId: number): boolean {
    return this.favoriteIds.has(movieId);
  }

  async toggleFavorite(movie: Movie, event: Event) {
    event.stopPropagation();
    if (this.pendingFavoriteIds.has(movie.id)) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const wasFavorite = this.isFavorite(movie.id);
    this.pendingFavoriteIds.add(movie.id);
    this.favoriteError = '';
    if (wasFavorite) this.favoriteIds.delete(movie.id);
    else this.favoriteIds.add(movie.id);

    try {
      if (wasFavorite) await this.favoriteService.removeFavorite(user.uid, movie.id);
      else await this.favoriteService.addFavorite(user.uid, movie);
    } catch (error) {
      console.error('Favorite could not be updated:', error);
      if (wasFavorite) this.favoriteIds.add(movie.id);
      else this.favoriteIds.delete(movie.id);
      this.favoriteError = 'Favorite could not be updated. Please try again.';
    } finally {
      this.pendingFavoriteIds.delete(movie.id);
    }
  }

  viewDetails(movie: Movie) {
    this.router.navigate(['/film-details', movie.id], { state: { movie } });
  }

  goToFavorites() {
    this.router.navigate(['/favorites']);
  }

  goToMatching() {
    this.router.navigate(['/matching']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }
}
