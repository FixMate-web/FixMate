import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {ProviderOnboardingPageComponent} from './provider-onboarding-page.component';
describe('Professional schedule editing',()=>{
 let http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({imports:[ProviderOnboardingPageComponent],providers:[provideHttpClient(),provideHttpClientTesting()]});http=TestBed.inject(HttpTestingController);});afterEach(()=>http.verify());
 const profile={id:'p1',userId:'u1',displayName:'QA Professional',bio:{ar:'نبذة عربية للاختبار',en:'Test biography'},yearsOfExperience:5,coverageGovernorates:['Amman'],coverageAreas:['Area'],weeklyAvailability:[],approvalStatus:'DRAFT',approvalFeedback:{},averageRating:0,reviewCount:0,offerings:[]};
 function fixture(){const f=TestBed.createComponent(ProviderOnboardingPageComponent);f.detectChanges();http.expectOne(r=>r.url.endsWith('/services')).flush({items:[]});http.expectOne(r=>r.url.endsWith('/providers/me')).flush(profile);return f;}
 it('persists edited hours through the owner API',()=>{const f=fixture();f.componentInstance.addWindow();f.componentInstance.windows.at(0).patchValue({dayOfWeek:2,startMinuteOfDay:600,endMinuteOfDay:900});f.componentInstance.saveSchedule();const req=http.expectOne(r=>r.method==='PATCH'&&r.url.endsWith('/providers/me'));expect(req.request.body).toEqual({weeklyAvailability:[{dayOfWeek:2,startMinuteOfDay:600,endMinuteOfDay:900}]});req.flush({...profile,weeklyAvailability:req.request.body.weeklyAvailability});expect(f.componentInstance.savingSchedule()).toBe(false);expect(f.componentInstance.profile()?.weeklyAvailability[0].dayOfWeek).toBe(2);});
 it('rejects overlapping windows without sending a mutation',()=>{const f=fixture();f.componentInstance.addWindow();f.componentInstance.addWindow();f.componentInstance.saveSchedule();http.expectNone(r=>r.method==='PATCH');expect(f.componentInstance.errorMessage()).toBeTruthy();});
 it('converts a JOD offering price to integer fils',()=>{const f=fixture();f.componentInstance.offeringForm.setValue({serviceId:'s1',pricingType:'FIXED',priceJod:16.125,estimatedDurationMinutes:60});f.componentInstance.saveOffering();const req=http.expectOne(r=>r.method==='PUT');expect(req.request.body.priceAmountFils).toBe(16125);req.flush({});http.expectOne(r=>r.url.endsWith('/services')).flush({items:[]});http.expectOne(r=>r.url.endsWith('/providers/me')).flush(profile);});
});
