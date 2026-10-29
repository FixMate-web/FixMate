import { PricingType } from '../../core/services/catalog-api.service';
export const GOVERNORATES = [
  ['Amman','عمّان'],['Irbid','إربد'],['Zarqa','الزرقاء'],['Balqa','البلقاء'],['Madaba','مادبا'],['Karak','الكرك'],['Tafilah','الطفيلة'],["Ma'an",'معان'],['Aqaba','العقبة'],['Jerash','جرش'],['Ajloun','عجلون'],['Mafraq','المفرق'],
] as const;
export const DAYS = [['Sunday','الأحد'],['Monday','الاثنين'],['Tuesday','الثلاثاء'],['Wednesday','الأربعاء'],['Thursday','الخميس'],['Friday','الجمعة'],['Saturday','السبت']] as const;
export function money(fils:number,lang:'ar'|'en'):string {
 return new Intl.NumberFormat(lang==='ar'?'ar-JO-u-nu-latn':'en-JO',{style:'currency',currency:'JOD',minimumFractionDigits:3}).format(fils/1000);
}
export function pricingLabel(type:PricingType,ar:boolean):string {
 return ({FIXED:ar?'سعر ثابت':'Fixed price',STARTING_AT:ar?'يبدأ من':'Starting at',INSPECTION_ONLY:ar?'رسوم المعاينة':'Inspection fee'})[type];
}
export function initials(name:string):string{return name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('');}
export function governorateLabel(value:string,ar:boolean):string {return GOVERNORATES.find(g=>g[0]===value)?.[ar?1:0]??value;}
export function validPage(value:string|null):number{const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:1;}
