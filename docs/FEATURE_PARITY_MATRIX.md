# Functional parity and delivery priorities

| Journey | Existing evidence | Starting state | Planned slice |
|---|---|---|---|
| Auth, refresh, logout, RBAC | Auth module/client/interceptor/guards and integration tests | Functional | Preserve security; improve account UX |
| Catalog search/filter/sort | Catalog DTO, controller, Angular service | Functional, visually weak | Photo cards, suggestions, URL state |
| Location discovery | Provider `governorate` filter | Partial frontend | Controlled 12-governorate selector and propagation |
| Provider results | Public approved-only API | Pagination absent in UI | Dense cards, filters, pagination |
| Provider detail | Public sanitized profile API | Visually weak | Identity, services, areas, localized hours, action panel |
| Provider onboarding | Owner PATCH/PUT/submit APIs | Availability UI read-only | Editable validated working hours |
| Catalog/admin moderation | Protected admin APIs | Functional, weak presentation | Forms, loading, decisions and confirmations |
| Project request intake | No request controller | Missing; backend required | Candidate next vertical slice after discovery/onboarding |
| Booking and slot reservation | Schemas/specifications only | Missing; backend required | Pending lifecycle and transactional reservation work |
| Messaging | No implemented API | Missing; backend required | Pending participant-only persistence and abuse controls |
| Reviews | Schema only | Missing; backend required | Pending eligible completion verification |
| Favorites | No API | Missing; backend required | Lower priority than request intake |
| Portfolio/profile images | No upload contract | Missing; backend required | Neutral identity fallback; stock photography only in editorial/service contexts |
| Payments | No authorized processor | Not applicable to current scope | No simulated payment |
| Native mobile | Not requested | Not applicable | Responsive web only |

No booking, messaging, or review capability is marked complete on the basis of schema presence. Final outcomes are recorded in FIXMATE_TRANSFORMATION_REPORT.md.
