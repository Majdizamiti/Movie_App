import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItem, IonAvatar, IonBadge, IonButton, IonButtons,
  IonIcon, IonInput, IonTextarea, IonSpinner
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Movie } from '../../../models/movie.model';
import { addIcons } from 'ionicons';
import type { CreateManagedUserInput } from '../../../services/admin-functions.service';
import { arrowBack, createOutline, trashOutline, addOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonAvatar, IonBadge,
    IonButton, IonButtons, IonIcon, IonInput, IonTextarea, IonSpinner
  ]
})
export class AdminDashboardPage implements OnInit {
  segment: 'users' | 'movies' = 'users';
  users: User[] = [];
  movies: Movie[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  editingMovieId: number | null = null;
  editingUserUid: string | null = null;
  userForm = this.emptyUserForm();

  movieForm = this.emptyMovieForm();

  constructor(
    private readonly adminService: AdminService,
    readonly authService: AuthService,
    private readonly router: Router
  ) {
    addIcons({ arrowBack, createOutline, trashOutline, addOutline, closeOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    await this.runSafely(async () => { this.users = await this.adminService.getUsers(); });
  }

  async loadMovies(): Promise<void> {
    await this.runSafely(async () => { this.movies = await this.adminService.getMovies(); });
  }

  async onSegmentChange(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.segment === 'users') await this.loadUsers();
    else await this.loadMovies();
  }

  editUser(user: User): void {
    this.editingUserUid = user.uid;
    this.userForm = { firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', age: user.age };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelUserEdit(): void { this.editingUserUid = null; this.userForm = this.emptyUserForm(); }

  async saveUser(): Promise<void> {
    const { firstName, lastName, email, password, age } = this.userForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      this.errorMessage = 'First name, last name, and email are required.';
      return;
    }
    await this.runSafely(async () => {
      if (this.editingUserUid) {
        await this.adminService.updateUser(this.editingUserUid, { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), age: Number(age) });
        this.successMessage = 'User profile updated.';
      } else {
        if (password.length < 8) throw new Error('Temporary password must contain at least 8 characters.');
        const input: CreateManagedUserInput = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, age: Number(age) };
        await this.adminService.createUser(input);
        this.successMessage = 'User account created.';
      }
      this.cancelUserEdit();
      this.users = await this.adminService.getUsers();
    });
  }

  async toggleUserStatus(user: User): Promise<void> {
    if (user.uid === this.authService.getCurrentUser()?.uid) {
      this.errorMessage = 'You cannot disable your own administrator account.';
      return;
    }
    await this.runSafely(async () => {
      await this.adminService.toggleUserActive(user.uid, user.active);
      this.users = this.users.map(item => item.uid === user.uid ? { ...item, active: !user.active } : item);
      this.successMessage = `Account ${user.active ? 'disabled' : 'enabled'} successfully.`;
    });
  }

  editMovie(movie: Movie): void {
    this.editingMovieId = movie.id;
    this.movieForm = {
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.posterPath,
      releaseDate: movie.releaseDate,
      voteAverage: movie.voteAverage
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelMovieEdit(): void {
    this.editingMovieId = null;
    this.movieForm = this.emptyMovieForm();
  }

  async saveMovie(): Promise<void> {
    const title = this.movieForm.title.trim();
    if (!title) {
      this.errorMessage = 'Movie title is required.';
      return;
    }
    if (this.movieForm.voteAverage < 0 || this.movieForm.voteAverage > 10) {
      this.errorMessage = 'Rating must be between 0 and 10.';
      return;
    }

    await this.runSafely(async () => {
      const movieData = {
        title,
        overview: this.movieForm.overview.trim(),
        posterPath: this.movieForm.posterPath.trim(),
        releaseDate: this.movieForm.releaseDate || '',
        voteAverage: Number(this.movieForm.voteAverage) || 0,
        createdBy: this.authService.getCurrentUser()?.uid
      };

      if (this.editingMovieId !== null) {
        await this.adminService.updateMovie(this.editingMovieId, movieData);
        this.successMessage = 'Custom movie updated.';
      } else {
        await this.adminService.addMovie(movieData);
        this.successMessage = 'Custom movie added.';
      }
      this.cancelMovieEdit();
      this.movies = await this.adminService.getMovies();
    });
  }

  async deleteMovie(movie: Movie): Promise<void> {
    if (!confirm(`Delete the custom movie “${movie.title}”?`)) return;
    await this.runSafely(async () => {
      await this.adminService.deleteMovie(movie.id);
      this.movies = this.movies.filter(item => item.id !== movie.id);
      if (this.editingMovieId === movie.id) this.cancelMovieEdit();
      this.successMessage = 'Custom movie deleted.';
    });
  }

  goBack(): void { void this.router.navigate(['/home']); }

  private emptyUserForm() { return { firstName: '', lastName: '', email: '', password: '', age: 18 }; }

  private emptyMovieForm() {
    return { title: '', overview: '', posterPath: '', releaseDate: '', voteAverage: 0 };
  }

  private async runSafely(action: () => Promise<void>): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await action();
    } catch (error) {
      console.error('Admin operation failed:', error);
      this.errorMessage = error instanceof Error ? error.message : 'The operation failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
