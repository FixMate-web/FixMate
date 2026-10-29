import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        title: 'FixMate | Home Maintenance Marketplace in Jordan',
        loadComponent: () =>
          import('./features/public/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'services',
        title: 'Services Catalog | FixMate',
        loadComponent: () =>
          import('./features/public/services-page.component').then((m) => m.ServicesPageComponent),
      },
      {
        path: 'services/:slug',
        title: 'Service Details | FixMate',
        loadComponent: () =>
          import('./features/public/service-detail-page.component').then(
            (m) => m.ServiceDetailPageComponent,
          ),
      },
      {
        path: 'providers',
        title: 'Approved Provider Directory | FixMate',
        loadComponent: () =>
          import('./features/public/providers-page.component').then(
            (m) => m.ProvidersPageComponent,
          ),
      },
      {
        path: 'providers/:id',
        title: 'Provider Profile | FixMate',
        loadComponent: () =>
          import('./features/public/provider-detail-page.component').then(
            (m) => m.ProviderDetailPageComponent,
          ),
      },
      {
        path: 'about',
        title: 'About FixMate | Jordan Home Maintenance',
        loadComponent: () =>
          import('./features/public/about-page.component').then((m) => m.AboutPageComponent),
      },
      {
        path: 'faq',
        title: 'FAQ | FixMate',
        loadComponent: () =>
          import('./features/public/faq-page.component').then((m) => m.FaqPageComponent),
      },
      {
        path: 'contact',
        title: 'Contact & Support | FixMate',
        loadComponent: () =>
          import('./features/public/contact-page.component').then((m) => m.ContactPageComponent),
      },
      {
        path: 'ui-showcase',
        title: 'Design System Showcase | FixMate',
        loadComponent: () =>
          import('./features/public/ui-showcase-page.component').then(
            (m) => m.UiShowcasePageComponent,
          ),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
      {
        path: 'login',
        title: 'Sign In | FixMate',
        loadComponent: () =>
          import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
      },
      {
        path: 'register',
        title: 'Create Account | FixMate',
        loadComponent: () =>
          import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'profile',
      },
      {path:'bookings',title:'Appointment Bookings | FixMate',loadComponent:()=>import('./features/bookings/bookings-page.component').then(m=>m.BookingsPageComponent)},
      {path:'bookings/new/:providerId',title:'Book Appointment | FixMate',canActivate:[roleGuard(['CUSTOMER'])],loadComponent:()=>import('./features/bookings/new-booking-page.component').then(m=>m.NewBookingPageComponent)},
      {path:'bookings/:id',title:'Booking Details | FixMate',loadComponent:()=>import('./features/bookings/bookings-page.component').then(m=>m.BookingsPageComponent)},
      {path:'notifications',title:'Notifications | FixMate',loadComponent:()=>import('./features/notifications/notifications-page.component').then(m=>m.NotificationsPageComponent)},
      {path:'requests',title:'Project Requests | FixMate',loadComponent:()=>import('./features/requests/requests-page.component').then(m=>m.RequestsPageComponent)},
      {path:'requests/new/:providerId',title:'New Project Request | FixMate',canActivate:[roleGuard(['CUSTOMER'])],loadComponent:()=>import('./features/requests/new-request-page.component').then(m=>m.NewRequestPageComponent)},
      {
        path: 'profile',
        title: 'My Profile | FixMate',
        loadComponent: () =>
          import('./features/account/profile-page.component').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'customer',
        canActivate: [roleGuard(['CUSTOMER'])],
        data: { role: 'CUSTOMER' },
        title: 'Customer Workspace | FixMate',
        loadComponent: () =>
          import('./features/dashboard/dashboard-overview-page.component').then(
            (m) => m.DashboardOverviewPageComponent,
          ),
      },
      {
        path: 'provider',
        canActivate: [roleGuard(['PROVIDER'])],
        data: { role: 'PROVIDER' },
        title: 'Provider Onboarding & Offerings | FixMate',
        loadComponent: () =>
          import('./features/provider/provider-onboarding-page.component').then(
            (m) => m.ProviderOnboardingPageComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        data: { role: 'ADMIN' },
        title: 'Admin Workspace | FixMate',
        loadComponent: () =>
          import('./features/admin/admin-providers-page.component').then(
            (m) => m.AdminProvidersPageComponent,
          ),
      },
      {
        path: 'admin/overview',
        canActivate: [roleGuard(['ADMIN'])],
        title: 'Platform Operations | FixMate Admin',
        loadComponent: () =>
          import('./features/admin/admin-overview-page.component').then(
            (m) => m.AdminOverviewPageComponent,
          ),
      },
      {
        path: 'admin/catalog',
        canActivate: [roleGuard(['ADMIN'])],
        title: 'Catalog Management | FixMate Admin',
        loadComponent: () =>
          import('./features/admin/admin-catalog-page.component').then(
            (m) => m.AdminCatalogPageComponent,
          ),
      },
      {
        path: 'admin/providers',
        canActivate: [roleGuard(['ADMIN'])],
        title: 'Provider Approval Queue | FixMate Admin',
        loadComponent: () =>
          import('./features/admin/admin-providers-page.component').then(
            (m) => m.AdminProvidersPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        title: 'Page Not Found (404) | FixMate',
        loadComponent: () =>
          import('./features/not-found/not-found-page.component').then(
            (m) => m.NotFoundPageComponent,
          ),
      },
    ],
  },
];
