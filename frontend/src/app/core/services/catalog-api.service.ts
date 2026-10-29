import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PricingType = 'FIXED' | 'STARTING_AT' | 'INSPECTION_ONLY';

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CatalogServiceItem {
  id: string;
  categoryId: string;
  category?: {
    id: string;
    slug: string;
    name: LocalizedText;
    iconName?: string;
  };
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  pricingPolicy: {
    pricingType: PricingType;
    indicativeAmountFils: number;
    currency: 'JOD';
  };
  defaultDurationMinutes: number;
  isActive: boolean;
}

export interface PaginatedServicesResponse {
  items: CatalogServiceItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServicesQueryParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  categoryId?: string;
  pricingType?: PricingType | '';
  q?: string;
  sort?: 'displayOrder' | 'price_asc' | 'price_desc' | 'title_asc';
}

export function formatFilsAsJod(fils: number, lang: 'ar' | 'en' = 'en'): string {
  const safeFils = Number.isFinite(fils) ? Math.max(0, Math.round(fils)) : 0;
  const jod = (safeFils / 1000).toFixed(3);
  return lang === 'ar'
    ? `${jod} د.أ (${safeFils.toLocaleString('en-US')} فلس)`
    : `${jod} JOD (${safeFils.toLocaleString('en-US')} fils)`;
}

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  getCategories(): Observable<CatalogCategory[]> {
    return this.http.get<CatalogCategory[]>(`${this.apiBase}/categories`);
  }

  getCategoryBySlug(
    slug: string,
  ): Observable<CatalogCategory & { services: CatalogServiceItem[] }> {
    return this.http.get<CatalogCategory & { services: CatalogServiceItem[] }>(
      `${this.apiBase}/categories/${encodeURIComponent(slug)}`,
    );
  }

  getServices(query: ServicesQueryParams = {}): Observable<PaginatedServicesResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.categorySlug) params = params.set('categorySlug', query.categorySlug);
    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    if (query.pricingType) params = params.set('pricingType', query.pricingType);
    if (query.q && query.q.trim()) params = params.set('q', query.q.trim());
    if (query.sort) params = params.set('sort', query.sort);

    return this.http.get<PaginatedServicesResponse>(`${this.apiBase}/services`, { params });
  }

  getServiceBySlug(slug: string): Observable<CatalogServiceItem> {
    return this.http.get<CatalogServiceItem>(
      `${this.apiBase}/services/${encodeURIComponent(slug)}`,
    );
  }

  getAdminCategories(): Observable<CatalogCategory[]> {
    return this.http.get<CatalogCategory[]>(`${this.apiBase}/admin/categories`);
  }

  createCategory(payload: {
    slug: string;
    name: LocalizedText;
    description: LocalizedText;
    iconName?: string;
    displayOrder?: number;
  }): Observable<CatalogCategory> {
    return this.http.post<CatalogCategory>(`${this.apiBase}/categories`, payload);
  }

  updateCategory(
    id: string,
    payload: Partial<{
      slug: string;
      name: LocalizedText;
      description: LocalizedText;
      iconName: string;
      displayOrder: number;
      isActive: boolean;
    }>,
  ): Observable<CatalogCategory> {
    return this.http.patch<CatalogCategory>(
      `${this.apiBase}/categories/${encodeURIComponent(id)}`,
      payload,
    );
  }

  getAdminServices(): Observable<CatalogServiceItem[]> {
    return this.http.get<CatalogServiceItem[]>(`${this.apiBase}/admin/services`);
  }

  createService(payload: {
    categoryId: string;
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    pricingPolicy: {
      pricingType: PricingType;
      indicativeAmountFils: number;
    };
    defaultDurationMinutes: number;
  }): Observable<CatalogServiceItem> {
    return this.http.post<CatalogServiceItem>(`${this.apiBase}/services`, payload);
  }

  updateService(
    id: string,
    payload: Partial<{
      categoryId: string;
      slug: string;
      title: LocalizedText;
      description: LocalizedText;
      pricingPolicy: {
        pricingType: PricingType;
        indicativeAmountFils: number;
      };
      defaultDurationMinutes: number;
      isActive: boolean;
    }>,
  ): Observable<CatalogServiceItem> {
    return this.http.patch<CatalogServiceItem>(
      `${this.apiBase}/services/${encodeURIComponent(id)}`,
      payload,
    );
  }
}
