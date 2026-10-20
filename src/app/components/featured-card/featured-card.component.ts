import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonCard, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, star } from 'ionicons/icons';

@Component({
  selector: 'app-featured-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IonButton, IonIcon],
  templateUrl: './featured-card.component.html',
  styleUrls: ['./featured-card.component.scss'],
})
export class FeaturedCardComponent {
  @Input() index = '01';
  @Input() title = 'Spider-Man: Brand New Day';
  @Input() description =
    "Fighting crime full-time as Spider-Man in a world that doesn't remember him—and the pressure of seeing his old life slip away.";
  @Input() rating = 8.5;
  @Input() year = 2026;
  @Input() tag = 'Popular pick';
  @Input() image = 'assets/spiderman.jpg';
  @Output() explore = new EventEmitter<void>();

  constructor() {
    addIcons({ play, star });
  }

  onExplore() {
    this.explore.emit();
  }
}
