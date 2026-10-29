import {ChangeDetectionStrategy,Component,DestroyRef,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {catchError,of,switchMap,tap} from 'rxjs';
import {LanguageService} from '../../core/i18n/language.service';
import {CatalogApiService,CatalogServiceItem} from '../../core/services/catalog-api.service';
import {ServiceImageComponent} from '../../shared/marketplace/service-image.component';
import {ServiceCardComponent} from '../../shared/marketplace/service-card.component';
import {money,pricingLabel} from '../../shared/marketplace/marketplace.utils';
@Component({selector:'app-service-detail-page',standalone:true,imports:[RouterLink,ServiceImageComponent,ServiceCardComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./service-detail-page.component.html',styleUrl:'./detail-page.scss'})
export class ServiceDetailPageComponent {
 readonly i18n=inject(LanguageService);readonly ar=()=>this.i18n.lang()==='ar';private readonly route=inject(ActivatedRoute);private readonly api=inject(CatalogApiService);private readonly destroyRef=inject(DestroyRef);readonly service=signal<CatalogServiceItem|null>(null);readonly loading=signal(true);readonly error=signal(false);readonly related=signal<CatalogServiceItem[]>([]);readonly governorate=signal('');readonly money=money;readonly pricingLabel=pricingLabel;
 constructor(){this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(p=>this.governorate.set(p.get('governorate')??''));this.route.paramMap.pipe(tap(()=>{this.loading.set(true);this.error.set(false);this.related.set([]);}),switchMap(p=>this.api.getServiceBySlug(p.get('slug')??'').pipe(catchError(()=>{this.error.set(true);return of(null);}))),tap(s=>{this.service.set(s);this.loading.set(false);}),switchMap(s=>s?this.api.getServices({categoryId:s.categoryId,limit:4}).pipe(catchError(()=>of({items:[]}))):of({items:[]})),takeUntilDestroyed(this.destroyRef)).subscribe(r=>this.related.set(r.items.filter(s=>s.id!==this.service()?.id)));}
}
