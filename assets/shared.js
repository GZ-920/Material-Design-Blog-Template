import { applyDynamicTheme, syncBackgroundForMode } from "./theme-engine.js";

export const CONFIG_URL="assets/site.config.json";
const THEME_KEY="chuyuan-theme-mode",CLIENT_KEY="chuyuan-like-client";

export async function loadConfig(cacheBust=false){const url=cacheBust?`${CONFIG_URL}?t=${Date.now()}`:CONFIG_URL;const r=await fetch(url,{cache:cacheBust?"no-store":"default"});if(!r.ok)throw new Error(`site.config.json 加载失败 (HTTP ${r.status})`);return r.json();}
export function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
export const escapeAttr=escapeHtml;

function setText(selector,value){document.querySelectorAll(selector).forEach(el=>el.textContent=value??"");}
export function applySiteChrome(config){
  setText("[data-site-name]",config.site?.name||"我的博客");setText("[data-site-tagline]",config.site?.tagline||"SEEKING THE TRUTH");setText("[data-copyright]",config.site?.copyright||"");
  const render=(el,buttons=false)=>{el.innerHTML=(config.social||[]).map(x=>`<a class="${buttons?"button button--tonal":""}" href="${escapeAttr(x.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.label)}</a>`).join("");};
  document.querySelectorAll("[data-social-links]").forEach(el=>render(el,!!el.closest(".filled-card,.info-card")));
  document.querySelectorAll("[data-footer-social]").forEach(el=>render(el,false));
  document.documentElement.lang=config.site?.language||"zh-CN";
}
function systemDark(){return matchMedia("(prefers-color-scheme: dark)").matches;}
function normalizeThemeMode(mode,config){
  if(mode==="light"||mode==="dark")return mode;
  const configured=config?.theme?.defaultMode;
  if(configured==="light"||configured==="dark")return configured;
  return systemDark()?"dark":"light";
}
function themeIcon(dark){
  return dark?'<span class="symbol symbol--light-mode" aria-hidden="true"></span>':'<span class="symbol symbol--dark-mode" aria-hidden="true"></span>';
}
function cssColor(name,fallback){return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;}
function parseHex(hex){
  const value=String(hex||"").trim();
  let m=value.match(/^#([\da-f]{6})$/i);
  if(m){const n=parseInt(m[1],16);return[(n>>16)&255,(n>>8)&255,n&255];}
  m=value.match(/^#([\da-f]{3})$/i);
  if(m){const s=m[1];return[parseInt(s[0]+s[0],16),parseInt(s[1]+s[1],16),parseInt(s[2]+s[2],16)];}
  m=value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*[^)]*)?\)$/i);
  if(m)return[Math.round(+m[1]),Math.round(+m[2]),Math.round(+m[3])];
  return null;
}
let logoRenderToken=0;
async function recolorLogos(){
  const logos=[...document.querySelectorAll("[data-dynamic-logo]")];if(!logos.length)return;
  const token=++logoRenderToken;
  const primary=parseHex(cssColor("--md-primary","#6750a4"))||[103,80,164];
  const tertiary=parseHex(cssColor("--md-tertiary","#7d5260"))||[125,82,96];
  const surface=parseHex(cssColor("--md-surface-container-lowest","#ffffff"))||[255,255,255];
  await Promise.all(logos.map(async img=>{
    try{
      const source=img.dataset.logoSource||img.getAttribute("src")||"assets/icon.png";
      const sourceImg=new Image();sourceImg.decoding="async";sourceImg.src=source;
      if(!sourceImg.complete)await sourceImg.decode();
      if(token!==logoRenderToken)return;
      const size=256,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)return;
      ctx.clearRect(0,0,size,size);ctx.drawImage(sourceImg,0,0,size,size);
      const pixels=ctx.getImageData(0,0,size,size),d=pixels.data;
      for(let i=0;i<d.length;i+=4){
        const a=d[i+3];if(a<8)continue;
        const r=d[i],g=d[i+1],b=d[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max-min;
        if(r>220&&g>220&&b>220&&sat<24){d[i]=surface[0];d[i+1]=surface[1];d[i+2]=surface[2];continue;}
        if(sat>22){const target=g>b?tertiary:primary;d[i]=target[0];d[i+1]=target[1];d[i+2]=target[2];}
      }
      ctx.putImageData(pixels,0,0);img.src=canvas.toDataURL("image/png");
    }catch(e){/* Local file previews can block canvas reads; keep the original logo. */}
  }));
}
export function applyThemeMode(mode,config){
  const normalized=normalizeThemeMode(mode,config),dark=normalized==="dark";
  document.documentElement.setAttribute("data-theme",dark?"dark":"light");document.documentElement.dataset.themeMode=normalized;
  syncBackgroundForMode(config,dark);
  document.querySelectorAll("[data-theme-icon]").forEach(el=>el.innerHTML=themeIcon(dark));
  document.querySelectorAll("[data-theme-toggle]").forEach(btn=>{const next=dark?"浅色":"深色";btn.title=`切换到${next}模式`;btn.setAttribute("aria-label",`切换到${next}模式`);});
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=cssColor("--md-surface",config.theme?.seedColor||"#6750A4");
  recolorLogos();
  window.dispatchEvent(new CustomEvent("blog-theme-change",{detail:{mode:normalized,dark}}));return dark;
}
export function initTheme(config,imageOverride=null){
  const stored=localStorage.getItem(THEME_KEY),mode=normalizeThemeMode(stored,config);
  localStorage.setItem(THEME_KEY,mode);
  const dark=mode==="dark";
  document.documentElement.setAttribute("data-theme",dark?"dark":"light");
  document.documentElement.dataset.themeMode=mode;
  document.querySelectorAll("[data-theme-toggle]").forEach(btn=>btn.addEventListener("click",()=>{const cur=normalizeThemeMode(localStorage.getItem(THEME_KEY),config),next=cur==="light"?"dark":"light";localStorage.setItem(THEME_KEY,next);applyThemeMode(next,config);}));
  const themePromise=applyDynamicTheme(config,imageOverride).then(()=>applyThemeMode(mode,config)).catch(()=>{});
  return themePromise;
}
export function initReveal(){const els=[...document.querySelectorAll("[data-reveal]")];if(matchMedia("(prefers-reduced-motion: reduce)").matches){els.forEach(x=>x.classList.add("is-visible"));return;}const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");io.unobserve(e.target);}}),{threshold:.08,rootMargin:"0px 0px -28px"});els.forEach(el=>io.observe(el));}
export function initBackToTop(enabled=true){const btn=document.querySelector("[data-back-to-top]");if(!btn||!enabled)return;const sync=()=>btn.hidden=scrollY<520;sync();addEventListener("scroll",sync,{passive:true});btn.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));}
export function registerPwa(enabled=true){if(enabled&&"serviceWorker"in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
function clientId(){let id=localStorage.getItem(CLIENT_KEY);if(!id){id=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem(CLIENT_KEY,id);}return id;}
const localLikeKey=s=>`chuyuan-like:${s}`,localCountKey=s=>`chuyuan-like-count:${s}`;
export class LikeClient{constructor(config){this.cfg=config?.likes||{};this.mode=this.cfg.mode||"auto";this.endpoint=this.cfg.endpoint||"/api/likes";this.id=clientId();this.cloudAvailable=null;}localGet(slug){return{count:Number(localStorage.getItem(localCountKey(slug))||0),liked:localStorage.getItem(localLikeKey(slug))==="1",source:"local"};}localToggle(slug){const cur=this.localGet(slug),liked=!cur.liked;let count=Math.max(0,cur.count+(liked?1:-1));localStorage.setItem(localLikeKey(slug),liked?"1":"0");localStorage.setItem(localCountKey(slug),String(count));return{count,liked,source:"local"};}async get(slug){if(this.mode==="local")return this.localGet(slug);try{const url=new URL(this.endpoint,location.href);url.searchParams.set("post",slug);url.searchParams.set("client",this.id);const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw new Error(String(r.status));this.cloudAvailable=true;return{...await r.json(),source:"cloud"};}catch(e){this.cloudAvailable=false;if(this.mode==="global")throw e;return this.localGet(slug);}}async toggle(slug){if(this.mode==="local"||(this.mode==="auto"&&this.cloudAvailable===false))return this.localToggle(slug);try{const cur=await this.get(slug);if(cur.source!=="cloud")return this.localToggle(slug);const r=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({post:slug,client:this.id,action:cur.liked?"unlike":"like"})});if(!r.ok)throw new Error(String(r.status));return{...await r.json(),source:"cloud"};}catch(e){if(this.mode==="global")throw e;this.cloudAvailable=false;return this.localToggle(slug);}}}
export async function bootCommon(config,imageOverride=null){
  window.__applyDynamicTheme=(cfg,override,opts)=>{
    const promise=applyDynamicTheme(cfg,override,opts);
    // Theme colors changed (e.g. hero carousel slide): re-render dynamic
    // logos so the top-bar mark and about-page mark follow the new palette.
    promise.then(()=>recolorLogos()).catch(()=>{});
    return promise;
  };
  applySiteChrome(config);const themePromise=initTheme(config,imageOverride);initReveal();initBackToTop(config.features?.backToTop!==false);registerPwa(config.features?.pwa!==false);
  window.dispatchEvent(new CustomEvent("bootCommon:ready",{detail:{config}}));
}
