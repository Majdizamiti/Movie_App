import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonBadge,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { addIcons } from 'ionicons';
import { arrowBack, heart, heartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-film-details',
  templateUrl: './film-details.page.html',
  styleUrls: ['./film-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonBadge,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent
  ]
})
export class FilmDetailsPage implements OnInit {
  movie: Movie | null = null;
  isFav = false;

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
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const movieId = Number(idParam);
      this.movie = await this.movieService.getMovieDetails(movieId);
      const user = this.authService.getCurrentUser();
      if (user) {
        this.isFav = await this.favoriteService.isFavorite(user.uid, movieId);
      }
    }
  }

  async toggleFavorite() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.movie) return;

    if (this.isFav) {
      await this.favoriteService.removeFavorite(user.uid, this.movie.id);
      this.isFav = false;
    } else {
      await this.favoriteService.addFavorite(user.uid, this.movie);
      this.isFav = true;
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
