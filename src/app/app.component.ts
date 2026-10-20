import { Component, DestroyRef, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.blurFocusedElement());
  }

  private blurFocusedElement(): void {
    let focusedElement: Element | null = document.activeElement;

    while (focusedElement instanceof HTMLElement && focusedElement.shadowRoot?.activeElement) {
      focusedElement = focusedElement.shadowRoot.activeElement;
    }

    if (focusedElement instanceof HTMLElement) focusedElement.blur();
  }
}
