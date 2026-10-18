import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonThumbnail, IonLabel, IonButton, IonButtons, IonIcon
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Favorite } from '../../models/favorite.model';
import { addIcons } from 'ionicons';
import { arrowBack, trash, heartDislikeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styles: [''],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonThumbnail, IonLabel, IonButton, IonButtons, IonIcon
  ]
})
export class FavoritesPage implements OnInit {
  favorites: Favorite[] = [];

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowBack, trash, heartDislikeOutline });
  }

  async ngOnInit() {
    await this.loadFavorites();
  }

  async loadFavorites() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.favorites = await this.favoriteService.getFavorites(user.uid);
    }
  }

  async remove(movieId: number) {
    const user = this.authService.getCurrentUser();
    if (user) {
      await this.favoriteService.removeFavorite(user.uid, movieId);
      await this.loadFavorites();
    }
  }

  viewDetails(movieId: number) {
    this.router.navigate(['/film-details', movieId]);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
