import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItem, IonAvatar, IonBadge, IonButton, IonButtons,
  IonIcon, IonInput, IonTextarea
} from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Movie } from '../../../models/movie.model';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styles: [''],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
    IonLabel, IonList, IonItem, IonAvatar, IonBadge, IonButton, IonButtons,
    IonIcon, IonInput, IonTextarea
  ]
})
export class AdminDashboardPage implements OnInit {
  segment = 'users';
  users: User[] = [];

  newMovieId: number = Date.now();
  newMovieTitle = '';
  newMovieOverview = '';
  newMoviePosterPath = '';
  newMovieReleaseDate = '';
  newMovieVoteAverage = 8.0;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowBack });
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.users = await this.adminService.getUsers();
  }

  async toggleUserStatus(user: User) {
    await this.adminService.toggleUserActive(user.uid, user.active);
    await this.loadUsers();
  }

  async onAddMovie() {
    if (!this.newMovieTitle || !this.newMoviePosterPath) {
      alert('Please provide title and poster path.');
      return;
    }

    const movie: Movie = {
      id: Number(this.newMovieId),
      title: this.newMovieTitle,
      overview: this.newMovieOverview,
      posterPath: this.newMoviePosterPath,
      releaseDate: this.newMovieReleaseDate || new Date().toISOString().split('T')[0],
      voteAverage: Number(this.newMovieVoteAverage),
      createdBy: this.authService.getCurrentUser()?.uid
    };

    await this.adminService.addMovie(movie);
    alert('Movie added successfully!');
    this.newMovieTitle = '';
    this.newMovieOverview = '';
    this.newMoviePosterPath = '';
    this.newMovieId = Date.now();
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
