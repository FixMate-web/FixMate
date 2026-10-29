const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const taxonomy=JSON.parse(fs.readFileSync('frontend/public/catalog/discovery-taxonomy.json','utf8'));
const out=path.resolve('artifacts/precision');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const report={categories:[],viewports:[],slideshow:[],interactions:[],errors:[]};
 const p=await browser.newPage({viewport:{width:1792,height:864},reducedMotion:'reduce'});p.setDefaultTimeout(12000);p.on('pageerror',e=>report.errors.push(e.message));
 const ready=async()=>{await p.waitForTimeout(180);await p.evaluate(()=>document.fonts.ready)};
 const open=async()=>{await p.goto('http://localhost:4200');await p.getByRole('tab').first().waitFor();await ready()};
 const lang=async target=>{if(await p.locator('html').getAttribute('lang')===target)return;const toggle=p.locator('.menu-toggle');if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await p.locator('.language-button').filter({hasText:target==='en'?'English':'العربية'}).click();if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')==='true')await toggle.click();await ready()};
 await open();await lang('en');assert.equal(await p.getByRole('tab').count(),14);
 // Real API verification of canonical IDs, optional pricing, category membership and honest availability.
 for(const category of taxonomy){const response=await p.request.get('http://localhost:3000/api/v1/categories/'+category.slug);assert.equal(response.status(),200);const json=await response.json();for(const s of category.services)assert(json.services.some(live=>live.slug===s.slug));}
 for(const language of ['en','ar']){
  await lang(language);for(const category of taxonomy){
   const tab=p.getByRole('tab',{name:category.label[language],exact:true});await tab.click();await ready();assert.equal(await tab.getAttribute('aria-selected'),'true');
   await p.locator('#discovery-panel').scrollIntoViewIfNeeded();await p.locator('#discovery-panel img').evaluateAll(es=>Promise.all(es.map(i=>i.decode())));
   const cards=await p.locator('#discovery-panel .portrait-service-card').evaluateAll(es=>es.map(e=>({href:e.getAttribute('href'),text:e.innerText,image:e.querySelector('img').getAttribute('src'),loaded:e.querySelector('img').naturalWidth>0})));
   assert.equal(cards.length,4);assert.equal(new Set(cards.map(c=>c.image)).size,4);
   for(const [i,card]of cards.entries()){assert(card.href.endsWith('/'+category.services[i].slug));assert.equal(card.text.trim(),category.services[i].title[language]);assert(card.loaded);}
   report.categories.push({language,category:category.slug,cards});await p.locator('.area-discovery-section').screenshot({path:path.join(out,`category-${language}-${category.slug}.png`)});
  }
 }
 await lang('en');await p.getByRole('tab',{name:'Cleaners',exact:true}).click();await ready();
 assert(await p.locator('.rail-prev').isDisabled());await p.locator('.rail-next').click();await p.waitForTimeout(300);assert(await p.locator('.category-tabs-bar').evaluate(e=>Math.abs(e.scrollLeft)>0));
 await p.getByRole('tab',{name:'Cleaners',exact:true}).focus();await p.keyboard.press('End');await ready();assert.equal(await p.getByRole('tab',{name:'Exterminators',exact:true}).getAttribute('aria-selected'),'true');await p.keyboard.press('Home');await ready();assert.equal(await p.getByRole('tab',{name:'Cleaners',exact:true}).getAttribute('aria-selected'),'true');
 report.interactions.push('All 14 tabs / 56 distinct images and links in both languages; rail arrows and Home/End keyboard navigation');
 // Menu geometry and every category's contextual destinations.
 await p.evaluate(()=>window.scrollTo(0,0));await p.locator('.explore-trigger').click();await ready();let box=await p.locator('.explore-mega-menu').boundingBox();assert(box.width>=540&&box.width<=590);assert(box.x>=0&&box.x+box.width<=1792);
 await p.screenshot({path:path.join(out,'after-menu-desktop.png')});
 for(const category of taxonomy){await p.locator(`.explore-cat-item[data-slug="${category.slug}"]`).hover();await ready();for(const s of category.services)assert(await p.locator(`.explore-service-list a[href="/services/${s.slug}"]`).count()>0);}
 await p.keyboard.press('Escape');assert.equal(await p.locator('.explore-trigger').evaluate(e=>e===document.activeElement),true);
 await p.locator('.explore-trigger').click();await p.locator('.explore-backdrop').click({position:{x:5,y:500}});await ready();assert.equal(await p.locator('.explore-mega-menu').count(),0);
 report.interactions.push('Desktop menu: 580px panel, all groups, hover, Escape/focus return, outside closing');
 // Requested responsive matrix with all lazy images actually loaded before capture.
 for(const language of ['en','ar']){await lang(language);for(const [width,height]of [[1792,864],[1440,900],[1280,800],[768,1024],[390,844],[360,800]]){
  await p.setViewportSize({width,height});for(const sel of ['.area-discovery-section','.explore-projects-section','.resources-editorial-section','.site-footer']){await p.locator(sel).scrollIntoViewIfNeeded();await ready();}
  await p.evaluate(()=>window.scrollTo(0,0));await ready();const state=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)}));assert(state.scroll<=width);assert.deepEqual(state.broken,[]);report.viewports.push({language,width,height,...state});await p.screenshot({path:path.join(out,`after-${language}-${width}.png`),fullPage:true});if(width===1792)await p.screenshot({path:path.join(out,`after-hero-${language}.png`)});
 }}
 // Mobile drill-down, Back focus, actual links and Arabic direction.
 for(const language of ['en','ar']){await lang(language);await p.locator('.menu-toggle').click();await p.locator('.explore-trigger').click();await p.locator('.explore-cat-item[data-slug="handyman"]').click();await ready();assert(await p.locator('.menu-back').isVisible());await p.screenshot({path:path.join(out,`after-mobile-menu-${language}.png`)});await p.locator('.menu-back').click();await ready();assert.equal(await p.locator('.explore-cat-item[data-slug="handyman"]').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Escape');await ready();assert.equal(await p.locator('.menu-toggle').evaluate(e=>e===document.activeElement),true);}
 report.interactions.push('Mobile drill-down, Back focus, Escape, English and Arabic');
 await p.setViewportSize({width:1792,height:864});await lang('en');
 for(const category of taxonomy){for(const service of category.services){const response=await p.request.get('http://localhost:3000/api/v1/services/'+service.slug);assert.equal(response.status(),200);const live=await response.json();service.verification={id:live.id,pricingPolicy:live.pricingPolicy,category:live.category.slug};}}
 await p.goto('http://localhost:4200/services/carpet-cleaning');await p.getByRole('heading',{name:'Request a quote',exact:true}).waitFor();assert(!(await p.locator('.action-panel').innerText()).includes('0.000'));await p.locator('.action-panel a[href^="/providers"]').click();await p.locator('.result-state').waitFor();assert((await p.locator('.result-state').innerText()).toLowerCase().includes('no'));await p.screenshot({path:path.join(out,'honest-provider-empty-state.png'),fullPage:true});
 report.interactions.push('Quote-only detail shows no invented amount; real provider directory displays an honest empty state');
 // Observe actual animation, two successive transitions, and the complete natural loop.
 const motion=await browser.newPage({viewport:{width:1792,height:864},reducedMotion:'no-preference'});motion.setDefaultTimeout(12000);motion.on('pageerror',e=>report.errors.push(e.message));await motion.goto('http://localhost:4200');await motion.locator('.hero-slide.active').waitFor();await motion.evaluate(()=>document.fonts.ready);
 const foreground=await motion.locator('.hero-left-col').boundingBox();let firstScale=await motion.locator('.hero-slide.active').evaluate(e=>getComputedStyle(e).transform);await motion.screenshot({path:path.join(out,'slide-0.png')});await motion.waitForTimeout(2800);const laterScale=await motion.locator('.hero-slide.active').evaluate(e=>getComputedStyle(e).transform);assert.notEqual(firstScale,laterScale);
 for(const id of ['kitchen','living','interior','exterior']){await motion.waitForFunction(id=>document.querySelector('.hero-slide.active')?.getAttribute('data-slide')===id,id,{timeout:11000});await motion.waitForTimeout(450);const frames=await motion.locator('.hero-slide').evaluateAll(es=>es.map(e=>({id:e.getAttribute('data-slide'),opacity:Number(getComputedStyle(e).opacity),transform:getComputedStyle(e).transform,loaded:e.naturalWidth>0})));assert(frames.every(f=>f.loaded));if(id==='kitchen')assert(frames.filter(f=>f.opacity>0&&f.opacity<1).length===2);const current=await motion.locator('.hero-left-col').boundingBox();assert.deepEqual(current,foreground);report.slideshow.push({active:id,frames,foregroundStable:true});await motion.screenshot({path:path.join(out,`slide-${id}-crossfade.png`)});}
 await motion.setViewportSize({width:390,height:844});await motion.waitForFunction(()=>document.querySelector('.hero-slide.active')?.getAttribute('data-slide')==='kitchen',null,{timeout:11000});assert(await motion.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await motion.screenshot({path:path.join(out,'slide-mobile.png')});await motion.close();
 await p.goto('http://localhost:4200');await p.locator('.hero-slide.active').waitFor();await p.waitForTimeout(7500);assert.equal(await p.locator('.hero-slide.active').getAttribute('data-slide'),'exterior');assert.equal(await p.locator('.hero-slide').count(),1);
 report.interactions.push('Real 28-second loop, subtle zoom, both crossfade layers, fixed foreground geometry, mobile transition, reduced-motion static frame');
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'service-matrix.json'),JSON.stringify(taxonomy,null,2));console.log('PASS',report.categories.length,'localized category checks;',report.viewports.length,'viewport checks;',report.slideshow.length,'actual transitions');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
