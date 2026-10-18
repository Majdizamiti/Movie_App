import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonButtons, IonIcon, IonSearchbar
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { FavoriteService } from '../services/favorite.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.model';
import { addIcons } from 'ionicons';
import { heart, heartOutline, people, person, settings, search } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styles: [''],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton, IonButtons, IonIcon, IonSearchbar
  ]
})
export class HomePage implements OnInit {
  movies: Movie[] = [];
  searchQuery = '';
  favoriteIds: Set<number> = new Set();

  constructor(
    private movieService: MovieService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ heart, heartOutline, people, person, settings, search });
  }

  async ngOnInit() {
    await this.loadMovies();
    await this.loadFavorites();
  }

  async loadMovies() {
    this.movies = await this.movieService.getPopularMovies();
  }

  async loadFavorites() {
    const user = this.authService.getCurrentUser();
    if (user) {
      const favs = await this.favoriteService.getFavorites(user.uid);
      this.favoriteIds = new Set(favs.map(f => f.movieId));
    }
  }

  async onSearch() {
    if (!this.searchQuery.trim()) {
      await this.loadMovies();
      return;
    }
    this.movies = await this.movieService.searchMovies(this.searchQuery);
  }

  isFavorite(movieId: number): boolean {
    return this.favoriteIds.has(movieId);
  }

  async toggleFavorite(movie: Movie, event: Event) {
    event.stopPropagation();
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (this.isFavorite(movie.id)) {
      await this.favoriteService.removeFavorite(user.uid, movie.id);
      this.favoriteIds.delete(movie.id);
    } else {
      await this.favoriteService.addFavorite(user.uid, movie);
      this.favoriteIds.add(movie.id);
    }
  }

  viewDetails(movieId: number) {
    this.router.navigate(['/film-details', movieId]);
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
