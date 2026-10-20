import { Injectable } from '@angular/core';
import { child, get, ref, remove, set, update } from 'firebase/database';
import { FirebaseService } from './firebase.service';
import { Movie } from '../models/movie.model';

/** CRUD for administrator-managed titles. TMDB data is never mutated. */
@Injectable({ providedIn: 'root' })
export class AdminMovieService {
  private readonly collectionPath = 'adminMovies';

  constructor(private readonly firebase: FirebaseService) {}

  async getAll(): Promise<Movie[]> {
    const snapshot = await get(child(ref(this.firebase.database), this.collectionPath));
    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val() as Record<string, Movie>)
      .map(([key, movie]) => ({ ...movie, id: Number(movie.id) || this.keyToNumericId(key) }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async getOne(id: number): Promise<Movie | null> {
    const snapshot = await get(ref(this.firebase.database, `${this.collectionPath}/${id}`));
    if (!snapshot.exists()) return null;

    const movie = snapshot.val() as Movie;
    return { ...movie, id: Number(movie.id) || id };
  }

  async create(movie: Omit<Movie, 'id'> & { id?: number }): Promise<Movie> {
    const title = movie.title.trim();
    if (!title) throw new Error('Movie title is required.');

    let id = movie.id ?? Date.now();
    let movieRef = ref(this.firebase.database, `${this.collectionPath}/${id}`);

    // Avoid overwriting a record if two movies are created in the same millisecond.
    while ((await get(movieRef)).exists()) {
      if (movie.id !== undefined) throw new Error('A custom movie with this ID already exists.');
      id += 1;
      movieRef = ref(this.firebase.database, `${this.collectionPath}/${id}`);
    }

    const record: Movie = { ...movie, title, id, createdAt: Date.now() };
    await set(movieRef, record);
    return record;
  }

  async update(id: number, changes: Partial<Movie>): Promise<void> {
    const movieRef = ref(this.firebase.database, `${this.collectionPath}/${id}`);
    const snapshot = await get(movieRef);
    if (!snapshot.exists()) throw new Error('This custom movie no longer exists.');

    const safeChanges = { ...changes };
    delete safeChanges.id;
    delete safeChanges.createdAt;
    delete safeChanges.createdBy;

    if (safeChanges.title !== undefined) {
      safeChanges.title = safeChanges.title.trim();
      if (!safeChanges.title) throw new Error('Movie title is required.');
    }
    if (safeChanges.voteAverage !== undefined &&
        (safeChanges.voteAverage < 0 || safeChanges.voteAverage > 10)) {
      throw new Error('Movie rating must be between 0 and 10.');
    }

    if (Object.keys(safeChanges).length === 0) return;
    await update(movieRef, safeChanges);
  }

  async delete(id: number): Promise<void> {
    await remove(ref(this.firebase.database, `${this.collectionPath}/${id}`));
  }

  private keyToNumericId(key: string): number {
    const numeric = Number(key);
    return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : Date.now();
  }
}
