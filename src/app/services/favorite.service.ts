import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { child, get, ref, remove, set } from 'firebase/database';
import { FirebaseService } from './firebase.service';
import { Favorite } from '../models/favorite.model';
import { Movie } from '../models/movie.model';

const DATABASE_TIMEOUT_MS = 8_000;

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly favoritesByUser = new Map<string, BehaviorSubject<Favorite[]>>();
  private readonly mutationVersions = new Map<string, number>();

  constructor(private readonly firebase: FirebaseService) {}

  watchFavorites(uid: string): Observable<Favorite[]> {
    return this.getState(uid).asObservable();
  }

  async getFavorites(uid: string): Promise<Favorite[]> {
    const versionAtStart = this.getMutationVersion(uid);
    const cached = this.readCache(uid);
    this.publish(uid, cached);

    try {
      const favoritesRef = ref(this.firebase.database, `users/${uid}/favorites`);
      const snapshot = await this.withTimeout(get(favoritesRef), DATABASE_TIMEOUT_MS);
      if (this.getMutationVersion(uid) !== versionAtStart) return this.getState(uid).value;

      if (snapshot.exists()) {
        const favorites = this.normalize(Object.values(snapshot.val()));
        this.publish(uid, favorites);
        return favorites;
      }

      // Migrate the old path only when the canonical path has no records.
      const legacyRef = ref(this.firebase.database, `favorites/${uid}`);
      const legacySnapshot = await this.withTimeout(get(legacyRef), DATABASE_TIMEOUT_MS);
      if (this.getMutationVersion(uid) !== versionAtStart) return this.getState(uid).value;

      const legacyFavorites = legacySnapshot.exists()
        ? this.normalize(Object.values(legacySnapshot.val()))
        : [];

      if (legacyFavorites.length > 0) {
        const records = Object.fromEntries(
          legacyFavorites.map(favorite => [String(favorite.movieId), favorite])
        );
        await set(favoritesRef, records);
        await remove(legacyRef);
      }

      this.publish(uid, legacyFavorites);
      return legacyFavorites;
    } catch (error) {
      // Cache is an offline display fallback, not a source to merge into live database data.
      console.warn('Favorites could not be refreshed from Firebase; showing cached favorites.', error);
      return this.getState(uid).value;
    }
  }

  async addFavorite(uid: string, movie: Movie): Promise<void> {
    const previous = this.getState(uid).value;
    const previousFavorite = previous.find(item => item.movieId === movie.id);
    this.bumpMutationVersion(uid);
    const favorite: Favorite = {
      movieId: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      addedAt: Date.now()
    };
    const next = [favorite, ...previous.filter(item => item.movieId !== movie.id)];

    this.publish(uid, next);
    try {
      await this.withTimeout(
        set(ref(this.firebase.database, `users/${uid}/favorites/${movie.id}`), favorite),
        DATABASE_TIMEOUT_MS
      );
    } catch (error) {
      const current = this.getState(uid).value.filter(item => item.movieId !== movie.id);
      if (previousFavorite) current.unshift(previousFavorite);
      this.publish(uid, current);
      throw error;
    }
  }

  async removeFavorite(uid: string, movieId: number): Promise<void> {
    const previous = this.getState(uid).value;
    const removedFavorite = previous.find(item => item.movieId === movieId);
    this.bumpMutationVersion(uid);
    const next = previous.filter(favorite => favorite.movieId !== movieId);
    this.publish(uid, next);

    try {
      await Promise.all([
        this.withTimeout(
          remove(ref(this.firebase.database, `users/${uid}/favorites/${movieId}`)),
          DATABASE_TIMEOUT_MS
        ),
        this.withTimeout(
          remove(ref(this.firebase.database, `favorites/${uid}/${movieId}`)),
          DATABASE_TIMEOUT_MS
        )
      ]);
    } catch (error) {
      const current = this.getState(uid).value;
      if (removedFavorite && !current.some(item => item.movieId === movieId)) {
        this.publish(uid, [removedFavorite, ...current]);
      }
      throw error;
    }
  }

  async isFavorite(uid: string, movieId: number): Promise<boolean> {
    const favorites = await this.getFavorites(uid);
    return favorites.some(favorite => favorite.movieId === movieId);
  }

  private getMutationVersion(uid: string): number {
    return this.mutationVersions.get(uid) ?? 0;
  }

  private bumpMutationVersion(uid: string): void {
    this.mutationVersions.set(uid, this.getMutationVersion(uid) + 1);
  }

  private getState(uid: string): BehaviorSubject<Favorite[]> {
    let state = this.favoritesByUser.get(uid);
    if (!state) {
      state = new BehaviorSubject<Favorite[]>(this.readCache(uid));
      this.favoritesByUser.set(uid, state);
    }
    return state;
  }

  private publish(uid: string, favorites: Favorite[]): void {
    const uniqueFavorites = [...new Map(favorites.map(item => [item.movieId, item])).values()];
    this.getState(uid).next(uniqueFavorites);
    try {
      localStorage.setItem(this.cacheKey(uid), JSON.stringify(uniqueFavorites));
    } catch (error) {
      // Storage may be unavailable or full; Firebase remains the source of truth.
      console.warn('Favorites cache could not be saved.', error);
    }
  }

  private readCache(uid: string): Favorite[] {
    try {
      const cached = localStorage.getItem(this.cacheKey(uid));
      return cached ? this.normalize(JSON.parse(cached)) : [];
    } catch (error) {
      console.warn('Favorites cache could not be read.', error);
      return [];
    }
  }

  private cacheKey(uid: string): string {
    return `movieapp_favorites_${uid}`;
  }

  private normalize(value: unknown): Favorite[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return [];
      const candidate = item as Partial<Favorite>;
      const movieId = Number(candidate.movieId);
      if (!Number.isSafeInteger(movieId) || movieId <= 0 || typeof candidate.title !== 'string') return [];

      return [{
        movieId,
        title: candidate.title,
        posterPath: typeof candidate.posterPath === 'string' ? candidate.posterPath : '',
        addedAt: Number(candidate.addedAt) || Date.now()
      }];
    });
  }

  private async withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Favorites request timed out.')), milliseconds);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
