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

@Injectable({ providedIn: 'root' })
export class MatchingService {
  constructor(
    private readonly favoriteService: FavoriteService,
    private readonly movieService: MovieService
  ) {}

  /**
   * Generates personalized movie recommendations for a user
   * based on genre preferences from their favorite movies.
   */
  async findRecommendations(user: User): Promise<MovieRecommendation[]> {
    // 1. Get user's favorites
    const favorites = await this.favoriteService.getFavorites(user.uid);
    const favoriteIds = new Set(favorites.map(fav => fav.movieId));

    // 2. Fetch full details of recent favorites to analyze genre preferences
    const recentFavorites = favorites.slice(0, 8);
    const favoriteMovies = await Promise.all(
      recentFavorites.map(fav => this.movieService.getMovieDetails(fav.movieId).catch(() => null))
    );

    // 3. Count genre occurrences in user's favorites
    const genreFrequency = new Map<number, number>();
    for (const movie of favoriteMovies) {
      for (const genreId of movie?.genreIds ?? []) {
        genreFrequency.set(genreId, (genreFrequency.get(genreId) ?? 0) + 1);
      }
    }

    // 4. Fetch popular movies and filter out already favorited ones
    const popularMovies = await this.movieService.getPopularMovies();
    const candidateMovies = popularMovies.filter(movie => !favoriteIds.has(movie.id));

    // 5. Score and rank candidate movies based on matching genres and ratings
    const recommendations: MovieRecommendation[] = candidateMovies.map(movie => {
      // Calculate genre overlap score
      const genreOverlap = (movie.genreIds ?? []).reduce(
        (sum, genreId) => sum + (genreFrequency.get(genreId) ?? 0),
        0
      );

      // Total score = genre matches + normalized rating bonus (0 to 1)
      const score = genreOverlap + (movie.voteAverage / 10);
      const reason = genreOverlap > 0 ? 'Based on genres you enjoy' : 'Popular pick to explore';

      return { movie, score, reason };
    });

    // 6. Sort by highest score and return top 20 recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }
}
