import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonList, IonItem,
  IonThumbnail, IonLabel, IonButton, IonButtons, IonBackButton, IonIcon, IonSegment, IonSegmentButton, IonText
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Favorite } from '../../models/favorite.model';
import { Movie } from '../../models/movie.model';
import { addIcons } from 'ionicons';
import { arrowBack, trash, heartDislikeOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonList, IonItem,
    IonThumbnail, IonLabel, IonButton, IonButtons, IonBackButton, IonIcon, IonSegment, IonSegmentButton, IonText
  ]
})
export class FavoritesPage implements OnDestroy {
  favorites: Favorite[] = [];
  segmentValue = 'all';
  private favoriteSubscription?: Subscription;
  private favoriteUid = '';

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowBack, trash, heartDislikeOutline });
  }

  ionViewWillEnter() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.favoriteSubscription?.unsubscribe();
      this.favoriteSubscription = undefined;
      this.favoriteUid = '';
      this.favorites = [];
      return;
    }
    if (this.favoriteUid !== user.uid) {
      this.favoriteSubscription?.unsubscribe();
      this.favoriteUid = user.uid;
      this.favoriteSubscription = this.favoriteService.watchFavorites(user.uid).subscribe(favorites => {
        this.favorites = favorites;
      });
    }
    void this.loadFavorites();
  }

  ngOnDestroy() {
    this.favoriteSubscription?.unsubscribe();
  }

  async loadFavorites() {
    const user = this.authService.getCurrentUser();
    if (user) {
      try {
        this.favorites = await this.favoriteService.getFavorites(user.uid);
      } catch (error) {
        console.error('Favorites could not be loaded:', error);
      }
    }
  }

  async remove(movieId: number) {
    const user = this.authService.getCurrentUser();
    if (user) {
      await this.favoriteService.removeFavorite(user.uid, movieId);
      await this.loadFavorites();
    }
  }

  viewDetails(favorite: Favorite) {
    const movie: Movie = {
      id: favorite.movieId,
      title: favorite.title,
      overview: '',
      posterPath: favorite.posterPath,
      releaseDate: '',
      voteAverage: 0
    };
    this.router.navigate(['/film-details', movie.id], { state: { movie } });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
