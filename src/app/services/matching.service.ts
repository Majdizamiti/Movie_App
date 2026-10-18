import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { FavoriteService } from './favorite.service';
import { User } from '../models/user.model';
import { Favorite } from '../models/favorite.model';

export interface MatchResult {
  user: User;
  percentage: number;
  commonMovies: Favorite[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {
  constructor(
    private userService: UserService,
    private favoriteService: FavoriteService
  ) {}

  async findMatches(currentUser: User): Promise<MatchResult[]> {
    const myFavorites = await this.favoriteService.getFavorites(currentUser.uid);
    const myFavIds = new Set(myFavorites.map(f => f.movieId));

    const allUsers = await this.userService.getAllUsers();
    const otherUsers = allUsers.filter(u => u.uid !== currentUser.uid && u.active);

    const matches: MatchResult[] = [];

    for (const otherUser of otherUsers) {
      const theirFavorites = await this.favoriteService.getFavorites(otherUser.uid);
      const theirFavIds = new Set(theirFavorites.map(f => f.movieId));

      const commonFavs = theirFavorites.filter(f => myFavIds.has(f.movieId));
      const commonCount = commonFavs.length;

      const maxFavorites = Math.max(myFavorites.length, theirFavorites.length);

      if (maxFavorites === 0) continue;

      const percentage = Math.round((commonCount / maxFavorites) * 100);

      if (percentage > 75) {
        matches.push({
          user: otherUser,
          percentage,
          commonMovies: commonFavs
        });
      }
    }

    return matches.sort((a, b) => b.percentage - a.percentage);
  }
}
