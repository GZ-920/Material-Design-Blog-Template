import { loadConfig, bootCommon, escapeHtml, escapeAttr } from "./shared.js";

let allPosts=[],activeCat="all",query="";
function asList(value){if(Array.isArray(value))return value;if(value==null)return[];return String(value).split(/[,，\n]/).map(x=>x.trim()).filter(Boolean);}
function renderHome(config){
  const eyebrow=document.querySelector("[data-home-eyebrow]");if(eyebrow)eyebrow.textContent=config.home?.eyebrow||"个人博客";
  const title=document.querySelector("[data-home-title]");if(title)title.innerHTML=escapeHtml(config.home?.title||"").replace(/\n/g,"<br>");
  const intro=document.querySelector("[data-home-intro]");if(intro)intro.textContent=config.home?.intro||"";
  const chips=document.querySelector("[data-home-chips]");if(chips)chips.innerHTML=asList(config.home?.chips).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("");
}
function renderBanner(config){
  const banner=document.querySelector("[data-banner]");if(!banner)return;
  const b=config.banner||{};
  if(b.enabled===false){banner.hidden=true;return;}
  const label=banner.querySelector("[data-banner-label]");if(label)label.textContent=b.label||"公告";
  const title=banner.querySelector("[data-banner-title]");if(title){title.textContent=b.title||"";title.hidden=!b.title;}
  const text=banner.querySelector("[data-banner-text]");if(text){text.textContent=b.message||"";text.hidden=!b.message;}
  const link=banner.querySelector("[data-banner-link]");if(link){const has=b.link&&b.linkLabel;link.hidden=!has;if(has){link.href=b.link;link.textContent=b.linkLabel;}}
  banner.classList.toggle("announcement-banner--danger",b.variant==="danger");
  const dismiss=banner.querySelector("[data-banner-dismiss]");if(dismiss){dismiss.hidden=b.showClose===false;}
  banner.hidden=false;
  dismiss?.addEventListener("click",()=>{banner.hidden=true;});
}
function initHeroCarousel(config){
  const root=document.querySelector("[data-hero-carousel]");if(!root)return;
  const cf=config.theme?.heroCarousel||{};
  if(cf.enabled===false){root.style.display="none";return;}
  const bg=config.theme?.background?.image;
  const items=(Array.isArray(cf.images)?cf.images:[]).map(x=>typeof x==="string"?{src:x,color:""}:x||{}).filter(x=>x.src);
  const images=items.map(x=>x.src);
  if(!images.length&&bg)images.push(bg);
  if(images.length<2){root.style.display="none";return;}
  const slides=root.querySelector("[data-hero-slides]");
  const indicators=root.querySelector("[data-hero-indicators]");
  slides.innerHTML=images.map((src,i)=>`<img class="hero-carousel__slide ${i===0?"is-active":""}" data-hero-slide="${i}" src="${escapeAttr(src)}" alt="" draggable="false" loading="${i===0?"eager":"lazy"}" decoding="async">`).join("");
  indicators.innerHTML=images.map((_,i)=>`<button class="hero-carousel__indicator ${i===0?"is-active":""}" data-hero-go="${i}" role="tab" aria-label="第 ${i+1} 张"></button>`).join("");
  let current=0;let timer=null;let busy=false;
  // Fit the carousel to the ACTIVE image's natural aspect ratio inside a
  // bounding box: landscape keeps full width (normal size), portrait gets a
  // narrower but TALLER box. The carousel is absolutely positioned, so these
  // size changes never shift the content below.
  const box=()=>{const vw=innerWidth;if(vw<=640)return{w:Math.min(vw*.76,320),h:Math.min(vw*.88,400)};if(vw<=980)return{w:Math.min(vw*.52,420),h:340};return{w:400,h:335};};
  const fitRatio=()=>{
    const el=slides.querySelector(".hero-carousel__slide.is-active");if(!el)return;
    const nw=el.naturalWidth,nh=el.naturalHeight;
    if(!nw||!nh){el.addEventListener("load",fitRatio,{once:true});return;}
    const r=nw/nh,b=box();
    let w=b.w,h=w/r;
    if(h>b.h){h=b.h;w=h*r;}
    root.style.width=`${Math.round(w)}px`;root.style.height=`${Math.round(h)}px`;
  };
  const fitRatioAll=()=>{slides.querySelectorAll(".hero-carousel__slide").forEach(img=>{if(!(img.complete&&img.naturalWidth))img.addEventListener("load",fitRatio,{once:true});});fitRatio();};
  let rz=0;addEventListener("resize",()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(fitRatio);});
  const applyThemeFor=i=>{
    const target=items[i];if(!target||!window.__applyDynamicTheme)return;
    const theme={...(config.theme||{}),background:{...(config.theme?.background||{}),image:target.src}};
    if(/^#[0-9a-f]{6}$/i.test(target.color||"")){theme.seedColor=target.color;theme.dynamicColor=false;theme.source="manual";}
    else {theme.dynamicColor=config.theme?.dynamicColor!==false;theme.source="background";}
    window.__applyDynamicTheme({...config,theme},null,{skipOverlay:true});
  };
  const go=next=>{
    if(busy||next===current)return;
    busy=true;
    const prev=current;current=(next+images.length)%images.length;
    const prevEl=slides.querySelector(`[data-hero-slide="${prev}"]`);
    const nextEl=slides.querySelector(`[data-hero-slide="${current}"]`);
    prevEl?.classList.remove("is-active");nextEl?.classList.add("is-active");
    indicators.querySelectorAll("[data-hero-go]").forEach((btn,i)=>btn.classList.toggle("is-active",i===current));
    const after=()=>{applyThemeFor(current);fitRatio();};
    if(nextEl?.complete&&nextEl.naturalWidth)after();else nextEl?.addEventListener("load",after,{once:true});
    setTimeout(()=>{busy=false;},320);
  };
  const start=()=>{stop();if(cf.autoplay===false)return;const interval=Math.max(800,Number(cf.interval)||3000);timer=setInterval(()=>go(current+1),interval);};
  const stop=()=>{if(timer){clearInterval(timer);timer=null;}};
  const restart=()=>{stop();start();};
  root.querySelector("[data-hero-prev]").addEventListener("click",()=>{go(current-1);restart();});
  root.querySelector("[data-hero-next]").addEventListener("click",()=>{go(current+1);restart();});
  indicators.addEventListener("click",e=>{const t=e.target.closest("[data-hero-go]");if(!t)return;go(Number(t.dataset.heroGo));restart();});
  let touch=null;
  root.addEventListener("touchstart",e=>{touch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  root.addEventListener("touchmove",e=>{if(!touch)return;e.preventDefault();},{passive:false});
  root.addEventListener("touchend",e=>{if(!touch)return;const dx=(e.changedTouches[0]?.clientX||0)-touch.x;if(Math.abs(dx)>40){go(current+(dx<0?1:-1));restart();}touch=null;});
  root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",()=>{if(cf.autoplay!==false)start();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else if(cf.autoplay!==false)start();});
  if(window.__applyDynamicTheme)applyThemeFor(0);
  else window.addEventListener("bootCommon:ready",()=>applyThemeFor(0),{once:true});
  fitRatioAll();
  start();
}
function categories(posts){const map=new Map();posts.forEach(p=>{const key=p.cat||"essay";if(!map.has(key))map.set(key,p.category||key);});return map;}
function renderTabs(posts){const tabs=document.querySelector("[data-category-tabs]");if(!tabs)return;const cats=categories(posts);tabs.innerHTML=`<button class="is-active" data-cat="all">全部</button>`+[...cats].map(([k,v])=>`<button data-cat="${escapeAttr(k)}">${escapeHtml(v)}</button>`).join("");tabs.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{activeCat=btn.dataset.cat;tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("is-active",x===btn));renderPosts();}));}
function postMatches(p){const catOk=activeCat==="all"||(p.cat||"essay")===activeCat;if(!catOk)return false;if(!query)return true;return[p.title,p.desc,p.category,p.log,...asList(p.tags)].join(" ").toLowerCase().includes(query);}
function renderPosts(){
  const c=document.getElementById("post-container");if(!c)return;const posts=allPosts.filter(postMatches);const count=document.querySelector("[data-post-count]");if(count)count.textContent=String(posts.length);const empty=document.querySelector("[data-empty]");if(empty)empty.hidden=posts.length!==0;
  c.innerHTML=posts.map(p=>{const href=`article.html?post=${encodeURIComponent(p.file)}`;return `<a class="post-card ${p.featured?"featured":""}" href="${href}" data-reveal>${p.cover?`<div class="post-cover-wrap"><img class="post-cover" src="${escapeAttr(p.cover)}" alt="" loading="lazy"></div>`:""}<div class="post-inner"><div class="post-topline"><span class="cat-pill">${escapeHtml(p.category||p.cat||"随笔")}</span><span>${escapeHtml(p.log||"")}</span></div><h3>${escapeHtml(p.title||"无标题")}</h3><p>${escapeHtml(p.desc||"")}</p><div class="post-footer"><span>${escapeHtml(p.date||"")} · ${escapeHtml(p.time||"")}</span><span class="tag-mini">${asList(p.tags).slice(0,2).map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</span></div></div></a>`;}).join("");
  requestAnimationFrame(()=>document.querySelectorAll(".post-card[data-reveal]").forEach((el,i)=>setTimeout(()=>el.classList.add("is-visible"),Math.min(i*45,180))));
}
async function loadPosts(){const c=document.getElementById("post-container");if(!c)return;try{const r=await fetch("posts/posts.json",{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();allPosts=Array.isArray(data)?data:[];renderTabs(allPosts);renderPosts();}catch(e){c.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><strong>文章列表加载失败</strong><p>${escapeHtml(e.message)}</p></div>`;}}
function initSearch(config){
  const input=document.getElementById("post-search"),wrap=document.querySelector("[data-search-wrap]"),clear=document.querySelector("[data-search-clear]");
  if(!input)return;if(config.features?.search===false){if(wrap)wrap.hidden=true;return;}
  const sync=()=>{query=input.value.trim().toLowerCase();if(clear)clear.hidden=!input.value;renderPosts();};
  input.addEventListener("input",sync);
  clear?.addEventListener("click",()=>{input.value="";sync();input.focus();});
  input.addEventListener("keydown",e=>{if(e.key==="Escape"&&input.value){input.value="";sync();}});
  addEventListener("keydown",e=>{if(e.key==="/"&&!/input|textarea|select/i.test(document.activeElement?.tagName||"")){e.preventDefault();input.focus();}});
}
(async()=>{try{const config=await loadConfig();renderHome(config);renderBanner(config);bootCommon(config);initSearch(config);initHeroCarousel(config);loadPosts();}catch(e){console.error(e);document.body.insertAdjacentHTML("afterbegin",`<div style="padding:12px;text-align:center;background:#ba1a1a;color:white">配置加载失败：${escapeHtml(e.message)}</div>`);}})();
