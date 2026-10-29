import {ChangeDetectionStrategy,Component,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {catchError,of,switchMap,tap} from 'rxjs';
import {LanguageService} from '../../core/i18n/language.service';
import {BookingsApiService,PublicReviewItem} from '../../core/services/bookings-api.service';
import {ProvidersApiService,PublicProviderDetail,formatMinuteOfDay} from '../../core/services/providers-api.service';
import {DAYS,initials,money,pricingLabel,governorateLabel} from '../../shared/marketplace/marketplace.utils';
@Component({selector:'app-provider-detail-page',standalone:true,imports:[RouterLink],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./provider-detail-page.component.html',styleUrl:'./detail-page.scss'})
export class ProviderDetailPageComponent {
 readonly i18n=inject(LanguageService);readonly ar=()=>this.i18n.lang()==='ar';private readonly route=inject(ActivatedRoute);private readonly api=inject(ProvidersApiService);private readonly bookingsApi=inject(BookingsApiService);readonly provider=signal<PublicProviderDetail|null>(null);readonly reviews=signal<PublicReviewItem[]>([]);readonly loading=signal(true);readonly error=signal(false);readonly days=DAYS;readonly money=money;readonly initials=initials;readonly pricingLabel=pricingLabel;readonly formatMin=formatMinuteOfDay;readonly governorateLabel=governorateLabel;
 constructor(){this.route.paramMap.pipe(tap(()=>{this.loading.set(true);this.error.set(false);}),switchMap(p=>this.api.getPublicProviderById(p.get('id')??'').pipe(catchError(()=>{this.error.set(true);return of(null);}))),takeUntilDestroyed()).subscribe(p=>{this.provider.set(p);this.loading.set(false);if(p){this.bookingsApi.listPublicProviderReviews(p.id,1,10).pipe(catchError(()=>of({items:[] as PublicReviewItem[]}))).subscribe(r=>this.reviews.set(r.items));}});}
 windows(day:number){return this.provider()?.weeklyAvailability.filter(w=>w.dayOfWeek===day).sort((a,b)=>a.startMinuteOfDay-b.startMinuteOfDay)??[];}
}
