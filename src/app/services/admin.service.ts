import { Injectable } from '@angular/core';
import { Movie } from '../models/movie.model';
import { User } from '../models/user.model';
import { AdminFunctionsService, CreateManagedUserInput } from './admin-functions.service';
import { AdminMovieService } from './admin-movie.service';
import { MovieService } from './movie.service';
import { UserService } from './user.service';

type EditableUserFields = Partial<Pick<User, 'firstName' | 'lastName' | 'age' | 'email' | 'photoUrl'>>;

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(
    private readonly users: UserService,
    private readonly functions: AdminFunctionsService,
    private readonly adminMovies: AdminMovieService,
    private readonly movieCatalog: MovieService
  ) {}

  getUsers(): Promise<User[]> {
    return this.users.getAllUsers();
  }

  getUser(uid: string): Promise<User | null> {
    return this.users.getUser(uid);
  }

  createUser(input: CreateManagedUserInput): Promise<{ uid: string }> {
    return this.functions.createUser(input);
  }

  updateUser(uid: string, changes: EditableUserFields): Promise<void> {
    return this.functions.updateUser({ uid, ...changes });
  }

  toggleUserActive(uid: string, currentlyActive: boolean): Promise<void> {
    return this.functions.setUserEnabled(uid, !currentlyActive);
  }

  getMovies(): Promise<Movie[]> {
    return this.adminMovies.getAll();
  }

  getMovie(id: number): Promise<Movie | null> {
    return this.adminMovies.getOne(id);
  }

  async addMovie(movie: Omit<Movie, 'id'> & { id?: number }): Promise<Movie> {
    const savedMovie = await this.adminMovies.create(movie);
    this.movieCatalog.invalidatePopularMoviesCache();
    return savedMovie;
  }

  async updateMovie(id: number, changes: Partial<Movie>): Promise<void> {
    await this.adminMovies.update(id, changes);
    this.movieCatalog.invalidatePopularMoviesCache();
  }

  async deleteMovie(id: number): Promise<void> {
    await this.adminMovies.delete(id);
    this.movieCatalog.invalidatePopularMoviesCache();
  }
}
