import {inject,Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {LocalizedText} from './catalog-api.service';
export type ProjectRequestStatus='OPEN'|'RESPONDED'|'DECLINED'|'CANCELLED';
export interface ProjectRequestView {id:string;providerProfileId:string;serviceId:string;customerName:string;providerName:string;serviceTitle:LocalizedText;governorate:string;area:string;description:string;status:ProjectRequestStatus;providerResponse?:string;respondedAt?:string;createdAt?:string;}
export interface CreateProjectRequest {providerProfileId:string;serviceId:string;clientRequestId:string;governorate:string;area:string;description:string;}
@Injectable({providedIn:'root'})
export class ProjectRequestsApiService {private readonly http=inject(HttpClient);private readonly url=environment.apiBaseUrl+'/project-requests';create(body:CreateProjectRequest){return this.http.post<ProjectRequestView>(this.url,body);}list(page=1){return this.http.get<{items:ProjectRequestView[];total:number;page:number;totalPages:number}>(this.url,{params:{page,limit:12}});}respond(id:string,status:'RESPONDED'|'DECLINED',response:string){return this.http.patch<ProjectRequestView>(`${this.url}/${encodeURIComponent(id)}/response`,{status,response});}cancel(id:string){return this.http.patch<ProjectRequestView>(`${this.url}/${encodeURIComponent(id)}/cancel`,{});}}
