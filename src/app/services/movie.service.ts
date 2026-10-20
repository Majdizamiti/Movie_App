import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Movie } from '../models/movie.model';
import { AdminMovieService } from './admin-movie.service';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

interface TmdbMovie {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  genres?: Array<{ id: number }>;
}

interface TmdbMovieResponse {
  results: TmdbMovie[];
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private readonly tmdbBaseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  private readonly http = inject(HttpClient);
  private readonly adminMovieService = inject(AdminMovieService);
  private popularMoviesRequest?: Promise<Movie[]>;

  preloadPopularMovies(): void {
    void this.getPopularMovies().catch(error => {
      console.error('Unable to preload movies from TMDB:', error);
    });
  }

  async getPopularMovies(): Promise<Movie[]> {
    if (!this.popularMoviesRequest) {
      this.popularMoviesRequest = this.loadPopularMovies();
    }

    try {
      return await this.popularMoviesRequest;
    } catch (error) {
      this.popularMoviesRequest = undefined;
      throw error;
    }
  }

  private async loadPopularMovies(): Promise<Movie[]> {
    const adminMoviesPromise = this.withTimeout(this.getAdminMovies(), 3500, [] as Movie[]);
    let tmdbMovies: Movie[];
    try {
      tmdbMovies = await this.fetchMovies('/movie/popular', { language: 'en-US', page: '1' });
    } catch (error) {
      console.error('TMDB popular movies request failed:', error);
      const adminMovies = await adminMoviesPromise;
      if (adminMovies.length) return adminMovies;
      throw error;
    }

    const adminMovies = await adminMoviesPromise;
    return this.mergeMovies(adminMovies, tmdbMovies);
  }

  async searchMovies(query: string): Promise<Movie[]> {
    const term = query.trim();
    if (!term) return this.getPopularMovies();

    try {
      const results = await this.fetchMovies('/search/movie', { query: term, language: 'en-US' });
      const adminMovies = await this.withTimeout(this.getAdminMovies(), 3500, [] as Movie[]);
      const matchingAdminMovies = adminMovies.filter(movie =>
        movie.title.toLocaleLowerCase().includes(term.toLocaleLowerCase())
      );
      return this.mergeMovies(matchingAdminMovies, results);
    } catch (error) {
      console.error('TMDB movie search failed:', error);
      const adminMovies = await this.withTimeout(this.getAdminMovies(), 3500, [] as Movie[]);
      const matchingAdminMovies = adminMovies.filter(movie =>
        movie.title.toLocaleLowerCase().includes(term.toLocaleLowerCase())
      );
      if (matchingAdminMovies.length) return matchingAdminMovies;
      throw error;
    }
  }

  async getMovieDetails(id: number): Promise<Movie | null> {
    const customMovie = await this.adminMovieService.getOne(id).catch(() => null);
    if (customMovie) return customMovie;

    try {
      const params = new HttpParams()
        .set('api_key', environment.tmdbApiKey)
        .set('language', 'en-US');
      const result = await firstValueFrom(
        this.http.get<TmdbMovie>(`${this.tmdbBaseUrl}/movie/${id}`, { params }).pipe(timeout({ first: 10000 }))
      );
      return this.mapMovie(result);
    } catch (error) {
      console.warn(`TMDB details request failed for movie ${id}:`, error);
      const adminMovies = await this.getAdminMovies();
      return adminMovies.find(movie => movie.id === id) ?? null;
    }
  }

  private async fetchMovies(path: string, query: Record<string, string>): Promise<Movie[]> {
    let params = new HttpParams().set('api_key', environment.tmdbApiKey);
    for (const [key, value] of Object.entries(query)) params = params.set(key, value);

    const response = await firstValueFrom(
      this.http.get<TmdbMovieResponse>(`${this.tmdbBaseUrl}${path}`, { params }).pipe(timeout({ first: 10000 }))
    );
    if (!Array.isArray(response.results)) {
      throw new Error('TMDB returned an invalid movie list.');
    }
    return response.results.map(movie => this.mapMovie(movie));
  }

  private mapMovie(movie: TmdbMovie): Movie {
    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview ?? '',
      posterPath: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : '',
      backdropPath: movie.backdrop_path ? `${this.imageBaseUrl}${movie.backdrop_path}` : '',
      releaseDate: movie.release_date ?? '',
      voteAverage: movie.vote_average ?? 0,
      genreIds: movie.genre_ids ?? movie.genres?.map(genre => genre.id)
    };
  }

  private mergeMovies(primary: Movie[], secondary: Movie[]): Movie[] {
    return [...new Map([...secondary, ...primary].map(movie => [movie.id, movie])).values()];
  }

  async getAdminMovies(): Promise<Movie[]> {
    try {
      return await this.adminMovieService.getAll();
    } catch (error) {
      console.warn('Custom movies could not be loaded from Firebase:', error);
      return [];
    }
  }

  private async withTimeout<T>(promise: Promise<T>, milliseconds: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>(resolve => {
          timer = setTimeout(() => resolve(fallback), milliseconds);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  invalidatePopularMoviesCache(): void {
    this.popularMoviesRequest = undefined;
  }
}
