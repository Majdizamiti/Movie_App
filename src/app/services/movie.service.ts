import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movie } from '../models/movie.model';
import { FirebaseService } from './firebase.service';
import { ref, get, set, child } from 'firebase/database';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private tmdbApiKey = 'YOUR_TMDB_API_KEY';
  private tmdbBaseUrl = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient, private firebaseService: FirebaseService) {}

  async getPopularMovies(): Promise<Movie[]> {
    let tmdbMovies: Movie[] = [];
    try {
      const url = `${this.tmdbBaseUrl}/movie/popular?api_key=${this.tmdbApiKey}&language=en-US&page=1`;
      const response: any = await firstValueFrom(this.http.get(url));
      tmdbMovies = response.results.map((m: any) => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
        releaseDate: m.release_date,
        voteAverage: m.vote_average,
        genreIds: m.genre_ids
      }));
    } catch (error) {
      console.warn('TMDB API fetch failed, using fallback catalog:', error);
      // Sample default popular movies if TMDB fails
      tmdbMovies = [
        { id: 27205, title: 'Inception', overview: 'A thief who steals corporate secrets through the use of dream-sharing technology...', posterPath: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', releaseDate: '2010-07-15', voteAverage: 8.8 },
        { id: 157336, title: 'Interstellar', overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', releaseDate: '2014-11-05', voteAverage: 8.6 },
        { id: 603, title: 'The Matrix', overview: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld...', posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', releaseDate: '1999-03-31', voteAverage: 8.7 },
        { id: 19995, title: 'Avatar', overview: 'A paraplegic marine dispatched to the moon Pandora on a unique mission...', posterPath: 'https://image.tmdb.org/t/p/w500/kyeOwRvylWRn48AI0fcIPJgL8z4.jpg', releaseDate: '2009-12-18', voteAverage: 7.5 }
      ];
    }

    const adminMovies = await this.getAdminMovies();
    return [...adminMovies, ...tmdbMovies];
  }

  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const url = `${this.tmdbBaseUrl}/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(query)}`;
      const response: any = await firstValueFrom(this.http.get(url));
      return response.results.map((m: any) => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
        releaseDate: m.release_date,
        voteAverage: m.vote_average,
        genreIds: m.genre_ids
      }));
    } catch (error) {
      console.error('Search failed:', error);
      const all = await this.getPopularMovies();
      return all.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    }
  }

  async getMovieDetails(id: number): Promise<Movie | null> {
    try {
      const url = `${this.tmdbBaseUrl}/movie/${id}?api_key=${this.tmdbApiKey}&language=en-US`;
      const m: any = await firstValueFrom(this.http.get(url));
      return {
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
        releaseDate: m.release_date,
        voteAverage: m.vote_average,
        genreIds: m.genres?.map((g: any) => g.id)
      };
    } catch (error) {
      const all = await this.getPopularMovies();
      const found = all.find(m => m.id === id);
      if (found) return found;

      const dbRef = ref(this.firebaseService.database);
      const snapshot = await get(child(dbRef, `movies/${id}`));
      if (snapshot.exists()) {
        return snapshot.val() as Movie;
      }
      return null;
    }
  }

  async getAdminMovies(): Promise<Movie[]> {
    try {
      const dbRef = ref(this.firebaseService.database);
      const snapshot = await get(child(dbRef, 'movies'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const movies = Object.values(data) as Movie[];
        localStorage.setItem('movieapp_local_movies', JSON.stringify(movies));
        return movies;
      }
    } catch (error) {
      console.warn('DB getAdminMovies permission error, falling back to local storage:', error);
    }

    const local = localStorage.getItem('movieapp_local_movies');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [];
  }

  async addMovie(movie: Movie): Promise<void> {
    try {
      const movieRef = ref(this.firebaseService.database, `movies/${movie.id}`);
      await set(movieRef, {
        ...movie,
        createdAt: Date.now()
      });
    } catch (error) {
      console.warn('DB addMovie permission error, saving to local storage:', error);
    }

    const movies = await this.getAdminMovies();
    if (!movies.some(m => m.id === movie.id)) {
      movies.push(movie);
      localStorage.setItem('movieapp_local_movies', JSON.stringify(movies));
    }
  }
}
