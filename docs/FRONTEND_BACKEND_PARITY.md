# FixMate — Exhaustive Frontend ↔ Backend Parity Matrix (Checkpoint C3)

**Timestamp:** 2026-10-29T18:40:00+03:00  
**Scope:** End-to-End Mapping of Every Frontend Action/Route to NestJS Controllers, DTOs, Guards, and Mongoose Collections

---

## 1. Authentication & User Accounts (`/api/v1/auth` & `/api/v1/users`)

| Frontend Screen / Service | HTTP Method & Path | Backend Controller & Handler | Request DTO | Auth Guard / Role | Mongoose Collection |
|---|---|---|---|---|---|
| `RegisterPageComponent` / `AuthService.register()` | `POST /api/v1/auth/register` | `AuthController.register` | `RegisterDto` | Public (Throttled) | `users`, `refresh_sessions` |
| `LoginPageComponent` / `AuthService.login()` | `POST /api/v1/auth/login` | `AuthController.login` | `LoginDto` | Public (Throttled) | `users`, `refresh_sessions` |
| `AuthService.refreshSession()` | `POST /api/v1/auth/refresh` | `AuthController.refresh` | Cookie `fixmate_refresh_token` | Public (`httpOnly` cookie) | `refresh_sessions`, `users` |
| `DashboardLayoutComponent` / `PublicLayoutComponent` | `POST /api/v1/auth/logout` | `AuthController.logout` | Cookie `fixmate_refresh_token` | Public / Authenticated | `refresh_sessions` |
| `ProfilePageComponent` / `AuthService.fetchMe()` | `GET /api/v1/users/me` | `UsersController.getMe` | — | `JwtAuthGuard` | `users` |
| `ProfilePageComponent.onSave()` | `PATCH /api/v1/users/me` | `UsersController.updateMe` | `UpdateMeDto` | `JwtAuthGuard` | `users` |

---

## 2. Categories & Services Catalog (`/api/v1/categories` & `/api/v1/services`)

| Frontend Screen / Service | HTTP Method & Path | Backend Controller & Handler | Request DTO | Auth Guard / Role | Mongoose Collection |
|---|---|---|---|---|---|
| `HomePageComponent` / `ServicesPageComponent` | `GET /api/v1/categories` | `CatalogController.listPublicCategories` | — | Public | `categories` |
| `HomePageComponent` / `ServicesPageComponent` | `GET /api/v1/services` | `CatalogController.listPublicServices` | `QueryPublicServicesDto` | Public | `services`, `categories` |
| `ServiceDetailPageComponent` | `GET /api/v1/services/:slug` | `CatalogController.getPublicServiceBySlug` | `:slug` | Public | `services`, `categories` |
| `AdminCatalogPageComponent` | `GET /api/v1/admin/categories` | `CatalogController.listAdminCategories` | — | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `categories` |
| `AdminCatalogPageComponent` | `POST /api/v1/categories` | `CatalogController.createCategory` | `CreateCategoryDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `categories` |
| `AdminCatalogPageComponent` | `PATCH /api/v1/categories/:id` | `CatalogController.updateCategory` | `UpdateCategoryDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `categories` |
| `AdminCatalogPageComponent` | `GET /api/v1/admin/services` | `CatalogController.listAdminServices` | — | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `services`, `categories` |
| `AdminCatalogPageComponent` | `POST /api/v1/services` | `CatalogController.createService` | `CreateServiceDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `services` |
| `AdminCatalogPageComponent` | `PATCH /api/v1/services/:id` | `CatalogController.updateService` | `UpdateServiceDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `services` |

---

## 3. Provider Onboarding, Approval & Public Directory (`/api/v1/providers`)

| Frontend Screen / Service | HTTP Method & Path | Backend Controller & Handler | Request DTO | Auth Guard / Role | Mongoose Collection |
|---|---|---|---|---|---|
| `ProvidersPageComponent` / `ServiceDetailPageComponent` | `GET /api/v1/providers` | `ProvidersController.listPublicProviders` | `QueryPublicProvidersDto` | Public | `provider_profiles`, `provider_service_offerings` |
| `ProviderDetailPageComponent` / `NewBookingPageComponent` | `GET /api/v1/providers/:id` | `ProvidersController.getPublicProviderById` | `:id` | Public | `provider_profiles`, `provider_service_offerings` |
| `ProviderOnboardingPageComponent` | `GET /api/v1/providers/me` | `ProvidersController.getMyProfile` | — | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `provider_profiles`, `provider_service_offerings` |
| `ProviderOnboardingPageComponent` | `PATCH /api/v1/providers/me` | `ProvidersController.updateMyProfile` | `UpdateProviderProfileDto` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `provider_profiles` |
| `ProviderOnboardingPageComponent` | `PUT /api/v1/providers/me/services` | `ProvidersController.upsertMyService` | `UpsertProviderServiceDto` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `provider_service_offerings` |
| `ProviderOnboardingPageComponent` | `DELETE /api/v1/providers/me/services/:serviceId` | `ProvidersController.removeMyService` | `:serviceId` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `provider_service_offerings` |
| `ProviderOnboardingPageComponent` | `POST /api/v1/providers/me/submit` | `ProvidersController.submitForReview` | — | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `provider_profiles` |
| `AdminProvidersPageComponent` | `GET /api/v1/admin/providers` | `ProvidersController.listProvidersForAdmin` | `QueryAdminProvidersDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `provider_profiles`, `users` |
| `AdminProvidersPageComponent` | `PATCH /api/v1/admin/providers/:id/approval` | `ProvidersController.updateProviderApproval` | `AdminProviderApprovalDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `provider_profiles`, `notifications` |

---

## 4. Customer Addresses, Bookings, Slot Reservations & Lifecycle (`/api/v1/addresses` & `/api/v1/bookings`)

| Frontend Screen / Service | HTTP Method & Path | Backend Controller & Handler | Request DTO | Auth Guard / Role | Mongoose Collection |
|---|---|---|---|---|---|
| `DashboardOverviewPageComponent` / `NewBookingPageComponent` | `GET /api/v1/addresses` | `AddressesController.listMyAddresses` | — | `JwtAuthGuard` | `addresses` |
| `DashboardOverviewPageComponent` | `POST /api/v1/addresses` | `AddressesController.createMyAddress` | `CreateAddressDto` | `JwtAuthGuard` | `addresses` |
| `BookingsApiService.updateAddress` | `PATCH /api/v1/addresses/:id` | `AddressesController.updateMyAddress` | `UpdateAddressDto` | `JwtAuthGuard` (Owner) | `addresses` |
| `DashboardOverviewPageComponent` | `DELETE /api/v1/addresses/:id` | `AddressesController.deleteMyAddress` | `:id` | `JwtAuthGuard` (Owner) | `addresses` |
| `NewBookingPageComponent` | `POST /api/v1/bookings` | `BookingsController.createBooking` | `CreateBookingDto` | `JwtAuthGuard`, `RolesGuard(CUSTOMER)` | `bookings`, `booking_events`, `notifications` |
| `BookingsPageComponent` / `DashboardOverviewPageComponent` | `GET /api/v1/bookings` | `BookingsController.listBookings` | `QueryBookingsDto` | `JwtAuthGuard` (Role-scoped) | `bookings` |
| `BookingsPageComponent` | `GET /api/v1/bookings/:id` | `BookingsController.getBookingById` | `:id` | `JwtAuthGuard` (Owner/Admin) | `bookings`, `booking_events`, `provider_slots` |
| `BookingsPageComponent.accept` | `PATCH /api/v1/bookings/:id/accept` | `BookingsController.acceptBooking` | `AcceptBookingDto` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `provider_slots`, `bookings`, `booking_events`, `notifications` |
| `BookingsPageComponent.reject` | `PATCH /api/v1/bookings/:id/reject` | `BookingsController.rejectBooking` | `RejectBookingDto` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `bookings`, `booking_events`, `notifications` |
| `BookingsPageComponent.startWork` | `PATCH /api/v1/bookings/:id/start` | `BookingsController.startBooking` | `StartBookingDto` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `bookings`, `booking_events` |
| `BookingsPageComponent.markWorkDone` | `PATCH /api/v1/bookings/:id/work-done` | `BookingsController.markWorkDone` | `MarkWorkDoneDto` | `JwtAuthGuard`, `RolesGuard(PROVIDER)` | `bookings`, `booking_events`, `notifications` |
| `BookingsPageComponent.complete` | `PATCH /api/v1/bookings/:id/complete` | `BookingsController.completeBooking` | `CompleteBookingDto` | `JwtAuthGuard`, `RolesGuard(CUSTOMER, ADMIN)` | `bookings`, `booking_events`, `notifications` |
| `BookingsPageComponent.cancel` | `PATCH /api/v1/bookings/:id/cancel` | `BookingsController.cancelBooking` | `CancelBookingDto` | `JwtAuthGuard`, `RolesGuard(CUSTOMER, PROVIDER, ADMIN)` | `bookings`, `provider_slots`, `booking_events`, `notifications` |

---

## 5. Verified Reviews, Project Requests, Notifications & Admin Operations

| Frontend Screen / Service | HTTP Method & Path | Backend Controller & Handler | Request DTO | Auth Guard / Role | Mongoose Collection |
|---|---|---|---|---|---|
| `BookingsPageComponent.submitReview` | `POST /api/v1/bookings/:id/review` | `ReviewsController.submitBookingReview` | `CreateReviewDto` | `JwtAuthGuard`, `RolesGuard(CUSTOMER)` | `reviews`, `provider_profiles`, `notifications` |
| `ProviderDetailPageComponent` | `GET /api/v1/providers/:id/reviews` | `ReviewsController.listPublicProviderReviews` | `QueryReviewsDto` | Public | `reviews` |
| `DashboardOverviewPageComponent` | `GET /api/v1/reviews/me` | `ReviewsController.listMyReviews` | — | `JwtAuthGuard` | `reviews` |
| `AdminOverviewPageComponent` | `GET /api/v1/admin/reviews` | `ReviewsController.listReviewsForAdmin` | `QueryReviewsDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `reviews` |
| `AdminOverviewPageComponent` | `PATCH /api/v1/admin/reviews/:id/visibility` | `ReviewsController.moderateReviewVisibility` | `ModerateReviewVisibilityDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `reviews`, `provider_profiles` |
| `NotificationsPageComponent` | `GET /api/v1/notifications` | `NotificationsController.listMyNotifications` | `QueryNotificationsDto` | `JwtAuthGuard` | `notifications` |
| `NotificationsPageComponent` | `PATCH /api/v1/notifications/:id/read` | `NotificationsController.markAsRead` | `:id` | `JwtAuthGuard` (Owner) | `notifications` |
| `NotificationsPageComponent` | `POST /api/v1/notifications/read-all` | `NotificationsController.markAllAsRead` | — | `JwtAuthGuard` | `notifications` |
| `AdminOverviewPageComponent` | `GET /api/v1/admin/overview` | `AdminController.getOverviewMetrics` | — | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `users`, `provider_profiles`, `bookings`, `reviews`, `categories`, `services` |
| `AdminOverviewPageComponent` | `GET /api/v1/admin/users` | `AdminController.listUsers` | `QueryAdminUsersDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `users` |
| `AdminOverviewPageComponent` | `PATCH /api/v1/admin/users/:id/status` | `AdminController.updateUserStatus` | `UpdateAdminUserStatusDto` | `JwtAuthGuard`, `RolesGuard(ADMIN)` | `users`, `refresh_sessions` |
| `NewRequestPageComponent` / `RequestsPageComponent` | `POST/GET/PATCH /api/v1/project-requests` | `ProjectRequestsController` | `CreateProjectRequestDto`, `RespondProjectRequestDto` | `JwtAuthGuard` | `project_requests` |
