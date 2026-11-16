import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col antialiased">
      <div class="flex h-screen overflow-hidden">
        <!-- Desktop Sidebar -->
        <div class="hidden lg:block shrink-0">
          <app-sidebar
            [isCollapsed]="isCollapsed()"
            (toggleCollapse)="isCollapsed.set(!isCollapsed())">
          </app-sidebar>
        </div>

        <!-- Mobile Sidebar Drawer (backdrop) -->
        @if (mobileOpen()) {
          <div
            (click)="mobileOpen.set(false)"
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity">
          </div>
          <div class="fixed inset-y-0 left-0 w-64 z-50 lg:hidden shadow-2xl animate-slide-in">
            <app-sidebar
              [isCollapsed]="false"
              (toggleCollapse)="mobileOpen.set(false)">
            </app-sidebar>
          </div>
        }

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <app-header
            [pageTitle]="currentTitle()"
            (toggleMobileSidebar)="mobileOpen.set(!mobileOpen())">
          </app-header>

          <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>

      <!-- Toast notifications -->
      <app-toast-container></app-toast-container>
    </div>
  `
})
export class AdminLayoutComponent {
  private router = inject(Router);

  isCollapsed = signal(false);
  mobileOpen = signal(false);
  currentTitle = signal('Dashboard');

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.mobileOpen.set(false);
        const url = event.urlAfterRedirects || event.url;
        this.updateTitle(url);
      });

    this.updateTitle(this.router.url);
  }

  private updateTitle(url: string) {
    if (url.includes('/books')) this.currentTitle.set('Book Management');
    else if (url.includes('/batches')) this.currentTitle.set('Batch Management');
    else if (url.includes('/users')) this.currentTitle.set('User Directory');
    else if (url.includes('/content')) this.currentTitle.set('App Content & CMS');
    else if (url.includes('/settings')) this.currentTitle.set('Admin Portal Settings');
    else this.currentTitle.set('Dashboard Overview');
  }
}

