import {ChangeDetectionStrategy,Component,computed,input,signal} from '@angular/core';
const CATEGORIES=new Set(['plumbing','electrical-repairs','ac-maintenance','cleaning','painting','carpentry']);
@Component({selector:'app-service-image',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,template:`<img [src]="source()+'-960.webp'" [srcset]="source()+'-480.webp 480w, '+source()+'-960.webp 960w'" [sizes]="sizes()" [alt]="alt()" width="960" height="640" [loading]="priority()?'eager':'lazy'" [attr.fetchpriority]="priority()?'high':'auto'" (error)="failed.set(true)">`,styles:[`:host{display:block;overflow:hidden;background:#edf0ec}img{display:block;width:100%;height:100%;aspect-ratio:3/2;object-fit:cover;transition:transform .25s}:host:hover img{transform:scale(1.025)}`]})
export class ServiceImageComponent {
 readonly category=input(''); readonly alt=input(''); readonly priority=input(false);readonly sizes=input('(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw');readonly failed=signal(false);
 readonly source=computed(()=>!this.failed()&&CATEGORIES.has(this.category())?'/images/categories/'+this.category():'/images/hero/home');
}
