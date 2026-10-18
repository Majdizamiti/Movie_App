import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { ref, get, set, remove, child } from 'firebase/database';
import { Favorite } from '../models/favorite.model';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(private firebaseService: FirebaseService) {}

  private getLocalKey(uid: string): string {
    return `movieapp_favorites_${uid}`;
  }

  async getFavorites(uid: string): Promise<Favorite[]> {
    try {
      const dbRef = ref(this.firebaseService.database);
      const snapshot = await get(child(dbRef, `favorites/${uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const favs = Object.values(data) as Favorite[];
        localStorage.setItem(this.getLocalKey(uid), JSON.stringify(favs));
        return favs;
      }
    } catch (error) {
      console.warn('DB getFavorites error, falling back to local storage:', error);
    }

    const local = localStorage.getItem(this.getLocalKey(uid));
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [];
  }

  async addFavorite(uid: string, movie: Movie): Promise<void> {
    const favorite: Favorite = {
      movieId: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      addedAt: Date.now()
    };

    try {
      const favRef = ref(this.firebaseService.database, `favorites/${uid}/${movie.id}`);
      await set(favRef, favorite);
    } catch (error) {
      console.warn('DB addFavorite error, saving to local storage:', error);
    }

    const favs = await this.getFavorites(uid);
    if (!favs.some(f => f.movieId === movie.id)) {
      favs.push(favorite);
      localStorage.setItem(this.getLocalKey(uid), JSON.stringify(favs));
    }
  }

  async removeFavorite(uid: string, movieId: number): Promise<void> {
    try {
      const favRef = ref(this.firebaseService.database, `favorites/${uid}/${movieId}`);
      await remove(favRef);
    } catch (error) {
      console.warn('DB removeFavorite error, updating local storage:', error);
    }

    let favs = await this.getFavorites(uid);
    favs = favs.filter(f => f.movieId !== movieId);
    localStorage.setItem(this.getLocalKey(uid), JSON.stringify(favs));
  }

  async isFavorite(uid: string, movieId: number): Promise<boolean> {
    const favs = await this.getFavorites(uid);
    return favs.some(f => f.movieId === movieId);
  }
}
