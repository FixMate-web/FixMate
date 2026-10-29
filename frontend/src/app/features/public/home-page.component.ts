import {ChangeDetectionStrategy,Component,DestroyRef,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {LanguageService} from '../../core/i18n/language.service';
import {CatalogApiService,CatalogCategory,CatalogServiceItem} from '../../core/services/catalog-api.service';
import {ProvidersApiService,PublicProviderSummary} from '../../core/services/providers-api.service';
import {DiscoverySearchComponent} from '../../shared/marketplace/discovery-search.component';
import {ServiceImageComponent} from '../../shared/marketplace/service-image.component';
import {ServiceCardComponent} from '../../shared/marketplace/service-card.component';
import {ProviderCardComponent} from '../../shared/marketplace/provider-card.component';
@Component({selector:'app-home-page',standalone:true,imports:[RouterLink,DiscoverySearchComponent,ServiceImageComponent,ServiceCardComponent,ProviderCardComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./home-page.component.html',styleUrl:'./home-page.component.scss'})
export class HomePageComponent {
 readonly i18n=inject(LanguageService);readonly ar=()=>this.i18n.lang()==='ar';private readonly api=inject(CatalogApiService);private readonly providersApi=inject(ProvidersApiService);private readonly destroyRef=inject(DestroyRef);
 readonly categories=signal<CatalogCategory[]>([]);readonly services=signal<CatalogServiceItem[]>([]);readonly providers=signal<PublicProviderSummary[]>([]);readonly loading=signal(true);readonly error=signal(false);readonly projectsLoading=signal(true);readonly projectsError=signal(false);readonly providersLoading=signal(true);readonly providersError=signal(false);
 constructor(){this.loadCategories();this.loadProjects();this.loadProviders();}
 loadCategories(){this.loading.set(true);this.error.set(false);this.api.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:cats=>{this.categories.set(cats);this.loading.set(false);},error:()=>{this.error.set(true);this.loading.set(false);}});}
 loadProjects(){this.projectsLoading.set(true);this.projectsError.set(false);this.api.getServices({limit:12}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:r=>{const seen=new Set<string>();this.services.set(r.items.filter(s=>{if(seen.has(s.categoryId))return false;seen.add(s.categoryId);return true;}).slice(0,6));this.projectsLoading.set(false);},error:()=>{this.projectsError.set(true);this.projectsLoading.set(false);}});}
 loadProviders(){this.providersLoading.set(true);this.providersError.set(false);this.providersApi.listPublicProviders({limit:2}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:r=>{this.providers.set(r.items);this.providersLoading.set(false);},error:()=>{this.providersError.set(true);this.providersLoading.set(false);}});}
}
