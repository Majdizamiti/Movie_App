import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { MovieService } from './movie.service';
import { User } from '../models/user.model';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(
    private userService: UserService,
    private movieService: MovieService
  ) {}

  async getUsers(): Promise<User[]> {
    return await this.userService.getAllUsers();
  }

  async toggleUserActive(uid: string, currentActive: boolean): Promise<void> {
    await this.userService.updateUserActiveStatus(uid, !currentActive);
  }

  async addMovie(movie: Movie): Promise<void> {
    await this.movieService.addMovie(movie);
  }
}
