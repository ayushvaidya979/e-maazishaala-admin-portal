import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const routes: Routes = [
  // Public Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Admin Sign In | e-MaziShaala'
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/callback/auth-callback.component').then(m => m.AuthCallbackComponent),
    title: 'Authenticating Admin... | e-MaziShaala'
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    title: 'Unauthorized Access | e-MaziShaala'
  },

  // Protected Admin Portal Shell
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Admin Dashboard | e-MaziShaala'
      },
      {
        path: 'books',
        loadComponent: () => import('./features/books/book-list/book-list.component').then(m => m.BookListComponent),
        title: 'Book Catalog Management | e-MaziShaala'
      },
      {
        path: 'batches',
        loadComponent: () => import('./features/batches/batch-list/batch-list.component').then(m => m.BatchListComponent),
        title: 'Batch Operations | e-MaziShaala'
      },
      {
        path: 'live-classes',
        loadComponent: () => import('./features/live-classes/live-class-list/live-class-list.component').then(m => m.LiveClassListComponent),
        title: 'Live Classroom Operations | e-MaziShaala'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
        title: 'User Management | e-MaziShaala'
      },
      {
        path: 'content',
        loadComponent: () => import('./features/content/content-management/content-management.component').then(m => m.ContentManagementComponent),
        title: 'CMS & Content Management | e-MaziShaala'
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Portal Settings | e-MaziShaala'
      }
    ]
  },

  // Wildcard fallback
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
