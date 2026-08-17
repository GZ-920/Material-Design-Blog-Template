const MATERIAL_UTILS_URL = "https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.3.0/+esm";

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const safeCssUrl=value=>String(value||"").replace(/["\\\n\r]/g,m=>`\\${m}`);

function hexToRgb(hex){
  const clean=String(hex||"#6750A4").replace("#","").trim();
  const full=clean.length===3?clean.split("").map(c=>c+c).join(""):clean.padEnd(6,"0").slice(0,6);
  const n=parseInt(full,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}
function rgbToHex({r,g,b}){return `#${[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("")}`.toUpperCase();}
function mix(a,b,t){const A=hexToRgb(a),B=hexToRgb(b);return rgbToHex({r:A.r+(B.r-A.r)*t,g:A.g+(B.g-A.g)*t,b:A.b+(B.b-A.b)*t});}
function rgbToHsl({r,g,b}){
  r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;
  if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}
  const l=(max+min)/2,s=d===0?0:d/(1-Math.abs(2*l-1));return{h,s:s*100,l:l*100};
}
function hslToHex(h,s,l){
  s/=100;l/=100;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else [r,g,b]=[c,0,x];
  return rgbToHex({r:(r+m)*255,g:(g+m)*255,b:(b+m)*255});
}

function fallbackScheme(seed,dark=false){
  const {h,s}=rgbToHsl(hexToRgb(seed));
  const sat=clamp(Math.max(s,38),32,70), secondaryHue=(h+26)%360, tertiaryHue=(h+326)%360;
  if(!dark){
    const surface=hslToHex(h,7,98);
    return {
      primary:hslToHex(h,sat,40),onPrimary:"#FFFFFF",primaryContainer:hslToHex(h,sat*.70,90),onPrimaryContainer:hslToHex(h,sat*.65,16),
      secondary:hslToHex(secondaryHue,clamp(sat*.42,20,40),40),onSecondary:"#FFFFFF",secondaryContainer:hslToHex(secondaryHue,clamp(sat*.32,16,34),90),onSecondaryContainer:hslToHex(secondaryHue,26,16),
      tertiary:hslToHex(tertiaryHue,clamp(sat*.5,24,48),40),onTertiary:"#FFFFFF",tertiaryContainer:hslToHex(tertiaryHue,clamp(sat*.38,20,42),90),onTertiaryContainer:hslToHex(tertiaryHue,30,16),
      surface,onSurface:hslToHex(h,10,11),onSurfaceVariant:hslToHex(h,8,29),outline:hslToHex(h,7,48),outlineVariant:hslToHex(h,9,80),inverseSurface:hslToHex(h,9,20),inverseOnSurface:hslToHex(h,7,95),error:"#BA1A1A",onError:"#FFFFFF",errorContainer:"#FFDAD6",onErrorContainer:"#410002"
    };
  }
  const surface=hslToHex(h,7,10);
  return {
    primary:hslToHex(h,clamp(sat*.72,38,62),80),onPrimary:hslToHex(h,sat*.6,20),primaryContainer:hslToHex(h,sat*.52,30),onPrimaryContainer:hslToHex(h,sat*.62,90),
    secondary:hslToHex(secondaryHue,clamp(sat*.34,18,34),80),onSecondary:hslToHex(secondaryHue,22,20),secondaryContainer:hslToHex(secondaryHue,22,30),onSecondaryContainer:hslToHex(secondaryHue,25,90),
    tertiary:hslToHex(tertiaryHue,clamp(sat*.4,22,40),80),onTertiary:hslToHex(tertiaryHue,25,20),tertiaryContainer:hslToHex(tertiaryHue,25,30),onTertiaryContainer:hslToHex(tertiaryHue,30,90),
    surface,onSurface:hslToHex(h,8,90),onSurfaceVariant:hslToHex(h,7,78),outline:hslToHex(h,6,58),outlineVariant:hslToHex(h,7,30),inverseSurface:hslToHex(h,7,90),inverseOnSurface:hslToHex(h,7,20),error:"#FFB4AB",onError:"#690005",errorContainer:"#93000A",onErrorContainer:"#FFDAD6"
  };
}

function normalizeScheme(s,dark){
  const surface=s.surface||s.background||(dark?"#141218":"#FFFBFE");
  const onSurface=s.onSurface||s.onBackground||(dark?"#E6E0E9":"#1D1B20");
  return {
    ...s,
    surface,
    onSurface,
    surfaceDim: dark?mix(surface,"#000000",.12):mix(surface,"#000000",.12),
    surfaceBright: dark?mix(surface,"#FFFFFF",.09):mix(surface,"#FFFFFF",.02),
    surfaceContainerLowest: dark?mix(surface,"#000000",.18):mix(surface,"#FFFFFF",.85),
    surfaceContainerLow: dark?mix(surface,"#FFFFFF",.035):mix(surface,onSurface,.035),
    surfaceContainer: dark?mix(surface,"#FFFFFF",.06):mix(surface,onSurface,.055),
    surfaceContainerHigh: dark?mix(surface,"#FFFFFF",.095):mix(surface,onSurface,.08),
    surfaceContainerHighest: dark?mix(surface,"#FFFFFF",.13):mix(surface,onSurface,.11)
  };
}

const tokenMap={
  primary:"--md-primary",onPrimary:"--md-on-primary",primaryContainer:"--md-primary-container",onPrimaryContainer:"--md-on-primary-container",
  secondary:"--md-secondary",onSecondary:"--md-on-secondary",secondaryContainer:"--md-secondary-container",onSecondaryContainer:"--md-on-secondary-container",
  tertiary:"--md-tertiary",onTertiary:"--md-on-tertiary",tertiaryContainer:"--md-tertiary-container",onTertiaryContainer:"--md-on-tertiary-container",
  surface:"--md-surface",surfaceDim:"--md-surface-dim",surfaceBright:"--md-surface-bright",surfaceContainerLowest:"--md-surface-container-lowest",surfaceContainerLow:"--md-surface-container-low",surfaceContainer:"--md-surface-container",surfaceContainerHigh:"--md-surface-container-high",surfaceContainerHighest:"--md-surface-container-highest",
  onSurface:"--md-on-surface",onSurfaceVariant:"--md-on-surface-variant",outline:"--md-outline",outlineVariant:"--md-outline-variant",inverseSurface:"--md-inverse-surface",inverseOnSurface:"--md-inverse-on-surface",error:"--md-error",onError:"--md-on-error",errorContainer:"--md-error-container",onErrorContainer:"--md-on-error-container"
};

function applyScheme(light,dark){
  const root=document.documentElement;
  const selected=root.getAttribute("data-theme")==="dark"?dark:light;
  Object.entries(tokenMap).forEach(([key,css])=>selected[key]&&root.style.setProperty(css,selected[key]));
  root.__m3Schemes={light,dark};
}

export function applyStoredSchemeForMode(dark){
  const schemes=document.documentElement.__m3Schemes;if(!schemes)return;
  const selected=dark?schemes.dark:schemes.light;
  Object.entries(tokenMap).forEach(([key,css])=>selected[key]&&document.documentElement.style.setProperty(css,selected[key]));
}

async function extractSeed(imageUrl,fallback){
  if(!imageUrl)return fallback;
  return new Promise(resolve=>{
    const img=new Image();img.crossOrigin="anonymous";img.decoding="async";
    img.onload=()=>{
      try{
        const size=64,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0,size,size);
        const data=ctx.getImageData(0,0,size,size).data;let rs=0,gs=0,bs=0,wSum=0;
        for(let i=0;i<data.length;i+=16){const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3]/255;if(a<.4)continue;const max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min,lum=(r+g+b)/3;if(lum<20||lum>242)continue;const w=a*(1+chroma/100);rs+=r*w;gs+=g*w;bs+=b*w;wSum+=w;}
        resolve(wSum?rgbToHex({r:rs/wSum,g:gs/wSum,b:bs/wSum}):fallback);
      }catch{resolve(fallback);}
    };
    img.onerror=()=>resolve(fallback);img.src=imageUrl;
  });
}

export async function applyDynamicTheme(config,imageOverride=null,opts={}){
  const root=document.documentElement,theme=config.theme||{},bg=theme.background||{};
  const image=imageOverride||bg.image||"";
  const fallback=theme.seedColor||"#6750A4";
  let seed;
  if(typeof opts.seedOverride==="string"&&/^#[0-9a-f]{6}$/i.test(opts.seedOverride)){
    seed=opts.seedOverride.toUpperCase();
  }else{
    const fromImage=!!image && (opts.forceImage || (theme.dynamicColor!==false && theme.source==="background"));
    seed=fromImage?await extractSeed(image,fallback):fallback;
  }
  let light,dark,engine="fallback";
  try{
    const utils=await Promise.race([
      import(MATERIAL_UTILS_URL),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("Material utilities timeout")),1500))
    ]);
    const argb=utils.argbFromHex(seed);
    const built=utils.themeFromSourceColor(argb);
    light=normalizeScheme(Object.fromEntries(Object.entries(built.schemes.light.toJSON()).map(([k,v])=>[k,utils.hexFromArgb(v)])),false);
    dark=normalizeScheme(Object.fromEntries(Object.entries(built.schemes.dark.toJSON()).map(([k,v])=>[k,utils.hexFromArgb(v)])),true);
    engine="material-color-utilities";
  }catch{
    light=normalizeScheme(fallbackScheme(seed,false),false);dark=normalizeScheme(fallbackScheme(seed,true),true);
  }
  root.dataset.seedColor=seed;root.dataset.colorEngine=engine;root.__m3Schemes={light,dark};
  applyScheme(light,dark);
  if(!opts.skipOverlay)syncBackgroundForMode(config,root.getAttribute("data-theme")==="dark",imageOverride);
}

export function syncBackgroundForMode(config,dark,imageOverride=null){
  applyStoredSchemeForMode(dark);
  const root=document.documentElement,bg=config.theme?.background||{},enabled=bg.enabled!==false,image=imageOverride||bg.image||"";
  root.style.setProperty("--background-image",enabled&&image?`url("${safeCssUrl(image)}")`:"none");
  root.style.setProperty("--background-position",bg.position||"center center");
  root.style.setProperty("--background-size",bg.size||"cover");
  root.style.setProperty("--background-blur",`${Number(bg.blur??18)}px`);
  root.style.setProperty("--background-opacity",String(dark?(bg.opacityDark??.07):(bg.opacityLight??.055)));
  root.style.setProperty("--background-overlay",String(dark?(bg.overlayDark??.9):(bg.overlayLight??.9)));
}
