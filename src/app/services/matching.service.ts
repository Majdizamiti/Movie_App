import { Injectable } from '@angular/core';
import { FavoriteService } from './favorite.service';
import { MovieService } from './movie.service';
import { Movie } from '../models/movie.model';
import { User } from '../models/user.model';

export interface MovieRecommendation {
  movie: Movie;
  score: number;
  reason: string;
}

/** Recommends titles using genres from the current user's favorite movies. */
@Injectable({ providedIn: 'root' })
export class MatchingService {
  constructor(
    private readonly favorites: FavoriteService,
    private readonly movies: MovieService
  ) {}

  async findRecommendations(user: User): Promise<MovieRecommendation[]> {
    const favorites = await this.favorites.getFavorites(user.uid);
    const favoriteIds = new Set(favorites.map(favorite => favorite.movieId));
    const favoriteDetails = await Promise.all(
      favorites.slice(0, 8).map(favorite => this.movies.getMovieDetails(favorite.movieId).catch(() => null))
    );
    const genreCounts = new Map<number, number>();

    for (const movie of favoriteDetails) {
      for (const genreId of movie?.genreIds ?? []) {
        genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1);
      }
    }

    const candidates = await this.movies.getPopularMovies();
    const scored = candidates
      .filter(movie => !favoriteIds.has(movie.id))
      .map(movie => {
        const overlap = (movie.genreIds ?? []).reduce((sum, id) => sum + (genreCounts.get(id) ?? 0), 0);
        const score = overlap + (movie.voteAverage / 10);
        return {
          movie,
          score,
          reason: overlap > 0 ? 'Based on genres you enjoy' : 'Popular pick to explore'
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return scored;
  }
}
