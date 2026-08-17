import { loadConfig, bootCommon, applyThemeMode, escapeHtml } from "./shared.js";
import { applyDynamicTheme } from "./theme-engine.js";
import { renderMarkdown } from "./markdown.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let config={},posts=[],current=null,currentMd="",pendingHero=[],pendingCover={home:null,article:null},gh={owner:"",repo:"",branch:"main",token:""};
const GH_STORAGE_KEY="chuyuan-gh-credentials",GH_REMEMBER_KEY="chuyuan-gh-remember";
function toast(msg,duration=2200){const el=$("[data-toast]");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),duration);}
function download(name,text,type="text/plain"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function deepGet(obj,path){return path.split(".").reduce((v,k)=>v?.[k],obj);}
function deepSet(obj,path,value){const parts=path.split("."),last=parts.pop();let cur=obj;for(const p of parts)cur=cur[p]??={};cur[last]=value;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function asList(value){if(Array.isArray(value))return value.map(x=>String(x).trim()).filter(Boolean);if(value==null)return[];return String(value).split(/[,，\n]/).map(x=>x.trim()).filter(Boolean);}
function bindTabs(){
  $$("[data-admin-tab]").forEach(btn=>btn.addEventListener("click",()=>{
    $$("[data-admin-tab]").forEach(x=>x.classList.toggle("is-active",x===btn));
    $$("[data-admin-panel]").forEach(p=>p.classList.toggle("is-active",p.dataset.adminPanel===btn.dataset.adminTab));
  }));
}
function populateConfig(){
  const panel=$("[data-admin-panel='appearance']");
  panel.querySelectorAll("[name]").forEach(el=>{const v=deepGet(config,el.name);if(el.type==="checkbox")el.checked=!!v;else if(Array.isArray(v))el.value=v.join(", ");else if(v!=null)el.value=v;});
  const c=config.comments||{};$("[data-giscus-enabled]").checked=!!c.enabled;$("[data-giscus-repo]").value=c.repo||"";$("[data-giscus-repo-id]").value=c.repoId||"";$("[data-giscus-category]").value=c.category||"";$("[data-giscus-category-id]").value=c.categoryId||"";
  gh.owner=config.admin?.githubOwner||"";gh.repo=config.admin?.githubRepo||"";gh.branch=config.admin?.githubBranch||"main";
  $("[data-gh-owner]").value=gh.owner;$("[data-gh-repo]").value=gh.repo;$("[data-gh-branch]").value=gh.branch;
  const bn=config.banner||{};
  $("[data-banner-enabled]").checked=bn.enabled!==false;$("[data-banner-variant]").value=bn.variant==="danger"?"danger":"theme";$("[data-banner-show-close]").checked=bn.showClose!==false;$("[data-banner-label]").value=bn.label||"公告";$("[data-banner-title]").value=bn.title||"";$("[data-banner-text]").value=bn.message||"";$("[data-banner-link]").value=bn.link||"";$("[data-banner-link-label]").value=bn.linkLabel||"";
  const hc=config.theme?.heroCarousel||{};$("[data-hero-enabled]").checked=hc.enabled!==false;$("[data-hero-autoplay]").checked=hc.autoplay!==false;$("[data-hero-interval]").value=Number(hc.interval||3000);renderHeroList(hc.images||[]);
}
function collectConfig(){
  const out=clone(config);
  const panel=$("[data-admin-panel='appearance']");
  panel.querySelectorAll("[name]").forEach(el=>{let v=el.type==="checkbox"?el.checked:el.value;if(el.type==="number")v=Number(v);if(el.name==="home.chips")v=asList(v);deepSet(out,el.name,v);});
  out.comments={...(out.comments||{}),enabled:$("[data-giscus-enabled]").checked,repo:$("[data-giscus-repo]").value.trim(),repoId:$("[data-giscus-repo-id]").value.trim(),category:$("[data-giscus-category]").value.trim(),categoryId:$("[data-giscus-category-id]").value.trim()};
  out.banner={enabled:$("[data-banner-enabled]").checked,variant:$("[data-banner-variant]").value,showClose:$("[data-banner-show-close]").checked,label:$("[data-banner-label]").value.trim()||"公告",title:$("[data-banner-title]").value.trim(),message:$("[data-banner-text]").value.trim(),link:$("[data-banner-link]").value.trim(),linkLabel:$("[data-banner-link-label]").value.trim()};
  out.admin={...(out.admin||{}),githubOwner:$("[data-gh-owner]").value.trim(),githubRepo:$("[data-gh-repo]").value.trim(),githubBranch:$("[data-gh-branch]").value.trim()||"main"};
  out.theme={...(out.theme||{}),heroCarousel:{enabled:$("[data-hero-enabled]").checked,autoplay:$("[data-hero-autoplay]").checked,interval:Math.max(1000,Number($("[data-hero-interval]").value)||3000),images:readHeroList()}};
  const pw=$("[data-admin-password]").value.trim();if(pw)out.admin.password=pw;
  return out;
}
async function previewConfig(){config=collectConfig();await applyDynamicTheme(config);applyThemeMode(document.documentElement.dataset.themeMode||config.theme?.defaultMode||"system",config);toast("已应用预览");}
function bindConfig(){
  const reset=$("[data-reset-config]"),preview=$("[data-preview-config]"),downloadBtn=$("[data-download-config]"),add=$("[data-hero-add]"),file=$("[data-hero-file]"),choose=$("[data-hero-upload]"),saveUpload=$("[data-hero-upload-save]"),linkAdd=$("[data-hero-link-add]");
  if(reset)reset.onclick=async()=>{try{config=await loadConfig(true);populateConfig();toast("已重新载入");}catch(e){toast(`重新载入失败：${e.message}`,9000);}};
  if(preview)preview.onclick=()=>previewConfig().catch(e=>toast(`预览失败：${e.message}`,9000));
  if(downloadBtn)downloadBtn.onclick=()=>{try{config=collectConfig();download("site.config.json",JSON.stringify(config,null,2),"application/json");toast("配置已下载");}catch(e){toast(`下载失败：${e.message}`,9000);}};
  if(add)add.onclick=()=>{const list=readHeroList();list.push({src:"images/head-new.jpeg",color:"#c0a089"});renderHeroList(list);toast("已添加头图占位项，请修改路径");};
  if(choose&&file)choose.onclick=()=>file.click();
  if(file)file.onchange=()=>{
    const list=[...file.files];if(!list.length){toast("未选择图片");return;}
    pendingHero=list.map(f=>({file:f,previewUrl:URL.createObjectURL(f),color:null,url:""}));
    renderPendingHero();
    pendingHero.forEach(async item=>{item.color=await autoColor(item.file);renderPendingHero();});
    toast(`已选择 ${pendingHero.length} 张头图，可为每张单独填写实际加载 URL`);
  };
  if(saveUpload)saveUpload.onclick=uploadHeroFiles;
  if(linkAdd)linkAdd.onclick=addHeroLink;
}
function renderHeroList(images){
  const box=$("[data-hero-list]");if(!box)return;
  if(!images.length){box.innerHTML=`<div class="hero-image-item-empty">尚未配置头图。</div>`;return;}
  box.innerHTML=images.map((item,i)=>{
    const src=typeof item==="string"?item:item.src||"";
    const color=typeof item==="object"&&item.color?item.color:"";
    return `<div class="hero-image-item" data-hero-index="${i}" draggable="true"><img src="${escapeHtml(src)}" alt=""><div class="hero-image-meta"><input type="text" data-hero-url value="${escapeHtml(src)}" placeholder="images/head01.jpeg"><input type="color" data-hero-color value="${/^#[0-9a-f]{6}$/i.test(color)?color:"#c0a089"}" title="点击编辑取色"><span class="hero-color-value" data-hero-color-text>${escapeHtml(color||"自动取色")}</span></div><div class="hero-image-actions"><button class="icon-button" type="button" data-hero-remove="${i}" title="删除" aria-label="删除"><span class="symbol symbol--close" aria-hidden="true"></span></button></div></div>`;
  }).join("");
  let dragIndex=-1;
  box.querySelectorAll(".hero-image-item").forEach(row=>{
    row.addEventListener("dragstart",()=>{dragIndex=Number(row.dataset.heroIndex);row.classList.add("is-dragging");});
    row.addEventListener("dragend",()=>row.classList.remove("is-dragging"));
    row.addEventListener("dragover",e=>e.preventDefault());
    row.addEventListener("drop",e=>{e.preventDefault();const to=Number(row.dataset.heroIndex);if(dragIndex<0||dragIndex===to)return;const list=readHeroList();const moved=list.splice(dragIndex,1)[0];list.splice(to,0,moved);renderHeroList(list);toast("头图顺序已调整");});
  });
  box.querySelectorAll("[data-hero-remove]").forEach(btn=>btn.onclick=()=>{const list=readHeroList();list.splice(Number(btn.dataset.heroRemove),1);renderHeroList(list);toast("已删除头图");});
  box.querySelectorAll("[data-hero-url]").forEach(inp=>inp.oninput=()=>{const row=inp.closest(".hero-image-item");const img=row?.querySelector("img");if(img)img.src=inp.value.trim();});
  box.querySelectorAll("[data-hero-color]").forEach(inp=>inp.oninput=()=>{const t=inp.parentElement.querySelector("[data-hero-color-text]");if(t)t.textContent=inp.value;});
}
function readHeroList(){return $$("[data-hero-url]").map((input,i)=>{const row=input.closest(".hero-image-item");const color=row?.querySelector("[data-hero-color]")?.value||"";return {src:input.value.trim(),color};}).filter(x=>x.src);}
async function autoColorFromUrl(url){
  try{
    const res=await fetch(url,{mode:"cors"});
    if(res.ok){const blob=await res.blob();const bitmap=await createImageBitmap(blob);const color=sampleColorFromDrawable(bitmap);if(bitmap.close)bitmap.close();if(color)return color;}
  }catch(e){console.warn("autoColorFromUrl: fetch+bitmap failed",e);}
  try{
    const img=new Image();img.crossOrigin="anonymous";
    if(img.decode){img.src=url;await img.decode();}
    else{await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});}
    const color=sampleColorFromDrawable(img);if(color)return color;
  }catch(e){console.warn("autoColorFromUrl: <img> decode failed",e);}
  return"#c0a089";
}
function renderPendingHero(){
  const box=$("[data-hero-pending]"),actions=$("[data-hero-pending-actions]");
  if(!box)return;
  if(!pendingHero.length){box.innerHTML="";if(actions)actions.hidden=true;return;}
  if(actions)actions.hidden=false;
  box.innerHTML=pendingHero.map((item,i)=>`<div class="hero-pending-item" data-pending-index="${i}"><img src="${item.previewUrl}" alt=""><div class="hero-pending-meta"><input type="text" data-pending-url placeholder="留空则上传到 GitHub 仓库，或填写实际加载 URL" value="${escapeHtml(item.url)}"><span class="hero-pending-color">${item.color?`<input type="color" data-pending-color value="${item.color}"><span>${escapeHtml(item.color)}</span>`:"取色中…"}</span></div><button class="icon-button" type="button" data-pending-remove title="移除" aria-label="移除"><span class="symbol symbol--close" aria-hidden="true"></span></button></div>`).join("");
  box.querySelectorAll("[data-pending-url]").forEach((inp,i)=>inp.oninput=()=>{pendingHero[i].url=inp.value.trim();});
  box.querySelectorAll("[data-pending-color]").forEach((inp,i)=>inp.oninput=()=>{pendingHero[i].color=inp.value;});
  box.querySelectorAll("[data-pending-remove]").forEach((btn,i)=>btn.onclick=()=>{URL.revokeObjectURL(pendingHero[i].previewUrl);pendingHero.splice(i,1);renderPendingHero();});
}
async function uploadHeroFiles(){
  if(!pendingHero.length){toast("请先选择头图");return;}
  const state=$("[data-hero-upload-state]"),btn=$("[data-hero-upload-save]");
  try{
    if(btn)btn.disabled=true;
    const externalItems=pendingHero.filter(item=>item.url);
    const githubItems=pendingHero.filter(item=>!item.url);
    if(githubItems.length){readGh();if(!gh.token){toast("有图片未填写实际加载 URL，需要连接 GitHub 才能上传到仓库");return;}}
    const existing=readHeroList();const files=[];let next=1;
    for(const item of externalItems){existing.push({src:item.url,color:item.color||"#c0a089"});}
    for(const item of githubItems){
      while(existing.some(x=>/^images\/head\d+\./i.test(x.src)&&Number((x.src.match(/head(\d+)\./i)||[])[1])===next))next++;
      const ext=extensionFor(item.file),path=`images/head${String(next).padStart(2,"0")}.${ext}`;
      const bytes=new Uint8Array(await item.file.arrayBuffer());let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
      files.push({path,content:btoa(bin)});existing.push({src:path,color:item.color||"#c0a089"});next++;
      if(state)state.textContent=`上传中 ${files.length}/${githubItems.length} 张`;
    }
    const nextConfig=clone(config);nextConfig.theme={...(nextConfig.theme||{}),heroCarousel:{enabled:$("[data-hero-enabled]").checked,autoplay:$("[data-hero-autoplay]").checked,interval:Math.max(1000,Number($("[data-hero-interval]").value)||3000),images:existing}};
    files.push({path:"assets/site.config.json",content:b64utf8(JSON.stringify(nextConfig,null,2))});
    await githubCommit(files,"Add/update hero carousel images");
    config=nextConfig;renderHeroList(existing);
    pendingHero.forEach(item=>URL.revokeObjectURL(item.previewUrl));pendingHero=[];renderPendingHero();
    if($("[data-hero-file]"))$("[data-hero-file]").value="";
    if(state)state.textContent="添加并保存成功";toast("头图已添加并保存成功",5000);
  }catch(e){if(state)state.textContent="保存失败";toast(e.message,9000);}finally{if(btn)btn.disabled=false;}
}
async function addHeroLink(){
  const input=$("[data-hero-link]");
  const urls=[...new Set((input?.value||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];
  if(!urls.length){toast("请先填写图片直链");return;}
  const state=$("[data-hero-upload-state]"),btn=$("[data-hero-link-add]");
  if(btn)btn.disabled=true;
  try{
    const list=readHeroList();
    for(let i=0;i<urls.length;i++){
      if(state)state.textContent=`取色中 ${i+1}/${urls.length}…`;
      const color=await autoColorFromUrl(urls[i]);
      list.push({src:urls[i],color});
      renderHeroList(list);
    }
    input.value="";
    if(state)state.textContent=`已导入 ${urls.length} 张，别忘了点击"保存轮播设置"`;
    toast(`已导入 ${urls.length} 张直链图片，记得保存轮播设置以提交到 GitHub`,5000);
  }finally{if(btn)btn.disabled=false;}
}
function extensionFor(file){const t=(file.type||"").toLowerCase();if(t.includes("png"))return"png";if(t.includes("webp"))return"webp";if(t.includes("gif"))return"gif";return"jpeg";}
function sampleColorFromDrawable(source,size=40){const c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true});c.width=c.height=size;ctx.drawImage(source,0,0,size,size);const d=ctx.getImageData(0,0,size,size).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<180)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}if(!n)return null;return`#${[r/n,g/n,b/n].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("")}`;}
async function autoColor(file){
  const errors=[];
  // Strategy 1: createImageBitmap (fast, works for standard formats)
  if(typeof createImageBitmap==="function"){
    try{
      const bitmap=await createImageBitmap(file);
      const color=sampleColorFromDrawable(bitmap);
      if(bitmap.close)bitmap.close();
      if(color)return color;
      errors.push("createImageBitmap: 图像全透明或采样为空");
    }catch(e){errors.push(`createImageBitmap: ${e?.message||e}`);}
  }
  // Strategy 2: <img> element decode (handles formats createImageBitmap may reject, e.g. some HEIC on Safari)
  let url;
  try{
    url=URL.createObjectURL(file);
    const img=new Image();
    if(img.decode){img.src=url;await img.decode();}
    else{await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});}
    const color=sampleColorFromDrawable(img);
    if(color)return color;
    errors.push("<img> 解码: 图像全透明或采样为空");
  }catch(e){errors.push(`<img> 解码: ${e?.message||e}`);}
  finally{if(url)URL.revokeObjectURL(url);}
  console.warn(`autoColor(${file.name||"文件"}) 取色失败，使用种子色。原因：`,errors);
  toast(`「${file.name||"图片"}」取色失败（${errors[errors.length-1]||"未知原因"}），已用种子色`,7000);
  return"#c0a089";
}
async function loadPosts(){const r=await fetch(`posts/posts.json?t=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error(`posts.json HTTP ${r.status}`);const data=await r.json();posts=Array.isArray(data)?data:[];renderPostList();if(posts[0])await openPost(posts[0].file);}
function renderPostList(){const box=$("[data-admin-post-list]");box.innerHTML=posts.map(p=>`<button data-open-post="${escapeHtml(p.file)}" class="${current?.file===p.file?"is-active":""}"><strong>${escapeHtml(p.title||p.file)}</strong><br><small>${escapeHtml(p.date||"")} · ${escapeHtml(p.category||p.cat||"")}</small></button>`).join("");box.querySelectorAll("[data-open-post]").forEach(b=>b.onclick=()=>openPost(b.dataset.openPost));}
async function openPost(file){current=clone(posts.find(p=>p.file===file)||{});const r=await fetch(`posts/${encodeURIComponent(file)}.md?t=${Date.now()}`,{cache:"no-store"});currentMd=r.ok?await r.text():`# ${current.title||"新文章"}\n`;fillEditor();renderPostList();$("[data-delete-post]").disabled=false;}
function fillEditor(){if(!current)return;$("[data-editor-heading]").textContent=current.title||"新文章";$("[data-post-file]").value=current.file||"";$("[data-post-cat]").value=current.cat||"essay";$("[data-post-title]").value=current.title||"";$("[data-post-desc]").value=current.desc||"";$("[data-post-category]").value=current.category||"";$("[data-post-date]").value=current.date||new Date().toISOString().slice(0,10);$("[data-post-time]").value=current.time||"5 min";$("[data-post-cover-home]").value=current.coverHome||current.cover||"";$("[data-post-cover-home-color]").value=/^#[0-9a-f]{6}$/i.test(current.coverColorHome||"")?current.coverColorHome:"#c0a089";$("[data-post-cover-article]").value=current.coverArticle||current.cover||"";$("[data-post-cover-article-color]").value=/^#[0-9a-f]{6}$/i.test(current.coverColorArticle||"")?current.coverColorArticle:"#c0a089";pendingCover.home=null;pendingCover.article=null;renderPendingCover("home");renderPendingCover("article");renderCurrentCover("home",$("[data-post-cover-home]").value,$("[data-post-cover-home-color]").value);renderCurrentCover("article",$("[data-post-cover-article]").value,$("[data-post-cover-article-color]").value);$("[data-post-featured]").checked=!!current.featured;$("[data-post-tags]").value=asList(current.tags).join(", ");$("[data-markdown]").value=currentMd;renderPreview();}
function collectPost(){
  const home=$("[data-post-cover-home]").value.trim(),article=$("[data-post-cover-article]").value.trim();
  const homeColor=$("[data-post-cover-home-color]").value,articleColor=$("[data-post-cover-article-color]").value;
  const same=home||article;
  const coverHome=home||same,coverArticle=article||same;
  return{file:$("[data-post-file]").value.trim(),cat:$("[data-post-cat]").value,category:$("[data-post-category]").value.trim(),log:current?.log||"POST",title:$("[data-post-title]").value.trim(),desc:$("[data-post-desc]").value.trim(),date:$("[data-post-date]").value,time:$("[data-post-time]").value.trim(),coverHome,coverArticle,cover:coverHome,coverColorHome:homeColor,coverColorArticle:articleColor,featured:$("[data-post-featured]").checked,tags:asList($("[data-post-tags]").value)};
}
function renderPreview(){const md=$("[data-markdown]").value;$("[data-markdown-preview]").innerHTML=renderMarkdown(md).html;}
function saveSession(){const p=collectPost();if(!p.file||!p.title){toast("请填写文件名和标题");return false;}current=p;currentMd=$("[data-markdown]").value;const i=posts.findIndex(x=>x.file===p.file);if(i>=0)posts[i]=clone(p);else posts.unshift(clone(p));renderPostList();$("[data-save-state]").textContent="已保存到当前编辑会话";toast("已保存");return true;}
function bindPosts(){
  $("[data-markdown]").addEventListener("input",renderPreview);
  $("[data-new-post]").onclick=()=>{current={file:"new-post",cat:"essay",category:"随笔",log:"POST",title:"新文章",desc:"",date:new Date().toISOString().slice(0,10),time:"5 min",coverHome:"",coverArticle:"",cover:"",featured:false,tags:[]};currentMd="# 新文章\n\n开始写作。";fillEditor();renderPostList();$("[data-delete-post]").disabled=true;};
  $("[data-save-post-local]").onclick=saveSession;
  $("[data-download-post]").onclick=()=>{if(saveSession())download(`${current.file}.md`,currentMd,"text/markdown");};
  $("[data-download-posts-json]").onclick=()=>{saveSession();download("posts.json",JSON.stringify(posts,null,2),"application/json");};
  bindCoverEditors();
  $("[data-delete-post]").onclick=async()=>{
    if(!current||!current.file){toast("请先选择文章");return;}
    const file=current.file;
    if(!posts.some(p=>p.file===file)){toast("当前文章尚未保存，无法删除");return;}
    if(!confirm(`确定删除文章「${current.title||file}」？\n将从 GitHub 删除 ${file}.md，并从索引中移除。`))return;
    try{
      const idx=posts.findIndex(p=>p.file===file);
      if(idx>=0)posts.splice(idx,1);
      if(gh.token||$("[data-gh-token]").value.trim()){
        await githubDelete(`posts/${file}.md`,`Delete post: ${file}`);
        await githubWrite("posts/posts.json",JSON.stringify(posts,null,2),"Remove deleted post from index");
        toast("文章已删除并提交到 GitHub");
      }else{
        toast("已从本地会话删除（未连接 GitHub，未提交）");
      }
      current=null;currentMd="";
      $("[data-editor-heading]").textContent="选择一篇文章";
      $("[data-delete-post]").disabled=true;
      renderPostList();
    }catch(e){toast(e.message,9000);}
  };
}
function bindCoverEditors(){
  ["home","article"].forEach(kind=>{
    const choose=$(`[data-cover-choose="${kind}"]`),file=$(`[data-cover-file="${kind}"]`),urlInput=$(`[data-post-cover-${kind}]`),colorInput=$(`[data-post-cover-${kind}-color]`);
    if(choose&&file)choose.onclick=()=>file.click();
    if(file)file.onchange=()=>{
      const list=[...file.files];if(!list.length){toast("未选择图片");return;}
      const f=list[0];
      if(pendingCover[kind]?.previewUrl)URL.revokeObjectURL(pendingCover[kind].previewUrl);
      pendingCover[kind]={file:f,previewUrl:URL.createObjectURL(f),color:null};
      renderPendingCover(kind);
      (async()=>{
        const color=await autoColor(f);
        if(pendingCover[kind]?.file===f){
          pendingCover[kind].color=color;
          colorInput.value=color;
          renderPendingCover(kind);
        }
      })();
      toast("已选择本地图片，自动取色完成后再填写实际加载 URL");
    };
    if(urlInput)urlInput.oninput=()=>renderCurrentCover(kind,urlInput.value,colorInput.value);
    if(colorInput)colorInput.oninput=()=>{
      const t=pendingCover[kind]||(urlInput.value?{color:colorInput.value}:null);
      if(t)t.color=colorInput.value;
      renderPendingCover(kind);
      renderCurrentCover(kind,urlInput.value,colorInput.value);
    };
  });
}
function renderPendingCover(kind){
  const box=$(`[data-cover-pending="${kind}"]`);if(!box)return;
  const item=pendingCover[kind];
  if(!item){
    box.innerHTML="";
    box.hidden=true;
    return;
  }
  box.hidden=false;
  box.innerHTML=`<div class="post-cover-pending-item"><img src="${item.previewUrl}" alt=""><div class="post-cover-pending-meta"><span class="hint">已选本地图片 ${escapeHtml(item.file.name||"")}，取色：${item.color?`<code>${escapeHtml(item.color)}</code>`:"取色中…"}</span><span class="hint">在上面的输入框中填写"实际加载 URL"可作为外链；留空则在提交文章时把图片本体上传到 <code>images/</code>。</span></div><button class="icon-button" type="button" data-cover-remove="${kind}" title="移除" aria-label="移除"><span class="symbol symbol--close" aria-hidden="true"></span></button></div>`;
  const rm=$(`[data-cover-remove="${kind}"]`);
  if(rm)rm.onclick=()=>{
    if(pendingCover[kind]?.previewUrl)URL.revokeObjectURL(pendingCover[kind].previewUrl);
    pendingCover[kind]=null;
    renderPendingCover(kind);
  };
}
function renderCurrentCover(kind,src,color){
  const box=$(`[data-cover-current="${kind}"]`);if(!box)return;
  if(!src){box.innerHTML="";return;}
  box.innerHTML=`<div class="post-cover-current-item"><img src="${escapeHtml(src)}" alt=""><span class="hint">取色：<code>${escapeHtml(color||"#c0a089")}</code></span></div>`;
}
function readGh(){gh={owner:$("[data-gh-owner]").value.trim(),repo:$("[data-gh-repo]").value.trim(),branch:$("[data-gh-branch]").value.trim()||"main",token:$("[data-gh-token]").value.trim()};return gh;}
function repoApi(path=""){const g=readGh();return `https://api.github.com/repos/${encodeURIComponent(g.owner)}/${encodeURIComponent(g.repo)}${path?`/${path.split("/").map(encodeURIComponent).join("/")}`:""}`;}
function authHeaders(){return{Accept:"application/vnd.github+json",Authorization:`Bearer ${gh.token}`,"X-GitHub-Api-Version":"2022-11-28"};}
async function githubError(res,action){let detail="";try{const data=await res.clone().json();detail=data?.message||JSON.stringify(data);}catch{try{detail=(await res.text()).trim();}catch{}}const requestId=res.headers.get("x-github-request-id");return `${action}失败 ${res.status}${detail?`: ${detail}`:""}${requestId?` · Request ID ${requestId}`:""}`;}
function b64utf8(text){const bytes=new TextEncoder().encode(text);let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin);}
async function githubFetch(url,options={},action="GitHub 请求"){
  let r;try{r=await fetch(url,{...options,headers:{...authHeaders(),...(options.headers||{})}});}catch(e){throw new Error(`${action}失败：无法连接 api.github.com（${e?.message||"网络错误"}）。请检查网络/代理是否能访问 GitHub，或稍后重试。`);}
  if(!r.ok)throw new Error(await githubError(r,action));return r;
}
async function githubCommit(files,message){
  readGh();if(!gh.owner||!gh.repo||!gh.branch||!gh.token)throw new Error("请先填写 Owner、Repository、Branch 和 GitHub PAT");
  const refGetUrl=repoApi(`git/ref/heads/${gh.branch}`);
  const refWriteUrl=repoApi(`git/refs/heads/${gh.branch}`);
  for(let attempt=0;attempt<3;attempt++){
    try{
      const ref=await githubFetch(refGetUrl,{},"读取分支");
      const head=(await ref.json()).object?.sha;if(!head)throw new Error("无法取得分支 SHA");
      const commit=await githubFetch(repoApi(`git/commits/${head}`),{},"读取当前提交");
      const baseTree=(await commit.json()).tree?.sha;if(!baseTree)throw new Error("无法取得当前树 SHA");
      const tree=[];
      for(const file of files){
        const blob=await githubFetch(repoApi("git/blobs"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:file.content,encoding:"base64"})},`上传 ${file.path}`);
        tree.push({path:file.path,mode:"100644",type:"blob",sha:(await blob.json()).sha});
      }
      const treeRes=await githubFetch(repoApi("git/trees"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({base_tree:baseTree,tree})},"创建提交树");
      const treeSha=(await treeRes.json()).sha;
      const commitRes=await githubFetch(repoApi("git/commits"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,tree:treeSha,parents:[head]})},"创建提交");
      const newSha=(await commitRes.json()).sha;
      try{
        await githubFetch(refWriteUrl,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({sha:newSha,force:false})},"更新分支");
        return newSha;
      }catch(e){
        if(!String(e.message).includes(" 409")||attempt===2)throw e;
      }
    }catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,700*(attempt+1)));}
  }
  throw new Error("GitHub 提交失败");
}
async function githubWrite(path,content,message){return githubCommit([{path,content:b64utf8(content)}],message);}
async function githubWriteBinary(path,file,message){const bytes=new Uint8Array(await file.arrayBuffer());let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return githubCommit([{path,content:btoa(bin)}],message);}
async function githubDelete(path,message){
  readGh();if(!gh.token)throw new Error("请先填写 GitHub PAT");
  const r=await githubFetch(repoApi(`contents/${path}`)+`?ref=${encodeURIComponent(gh.branch)}`,{},`读取 ${path}`);const sha=(await r.json()).sha;
  const delUrl=repoApi(`contents/${path}`);
  const del=await githubFetch(delUrl,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,branch:gh.branch,sha})},`删除 ${path}`);return del.json();
}
function restoreGh(){let saved=null;try{saved=JSON.parse(localStorage.getItem(GH_STORAGE_KEY)||"null");}catch{}if(!saved||typeof saved!=="object")return false;gh={...gh,...saved};$("[data-gh-owner]").value=gh.owner||"";$("[data-gh-repo]").value=gh.repo||"";$("[data-gh-branch]").value=gh.branch||"main";if(gh.token)$("[data-gh-token]").value=gh.token;$("[data-gh-remember]").checked=localStorage.getItem(GH_REMEMBER_KEY)==="1";return !!gh.token;}
async function testGithub(silent=false){readGh();if(!gh.owner||!gh.repo||!gh.token){toast("请填写仓库和 PAT");return;}const user=await fetch("https://api.github.com/user",{headers:authHeaders()});if(!user.ok){toast(await githubError(user,"PAT 认证"),9000);return;}const me=await user.json();const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}`,{headers:authHeaders()});if(!r.ok){toast(await githubError(r,"访问仓库"),9000);return;}$("[data-admin-status]").textContent=`已认证：${me.login}`;$("[data-push-config]").disabled=false;$("[data-push-post]").disabled=false;$("[data-save-giscus]").disabled=false;$("[data-save-password]").disabled=false;$("[data-save-hero]").disabled=false;$("[data-save-site]").disabled=false;$("[data-save-theme]").disabled=false;$("[data-save-banner]").disabled=false;$("[data-hero-upload-save]").disabled=false;if($("[data-gh-remember]").checked){localStorage.setItem(GH_STORAGE_KEY,JSON.stringify({owner:gh.owner,repo:gh.repo,branch:gh.branch,token:gh.token}));localStorage.setItem(GH_REMEMBER_KEY,"1");}else{localStorage.removeItem(GH_STORAGE_KEY);localStorage.removeItem(GH_REMEMBER_KEY);}if(!silent)toast(`PAT 认证成功：${me.login}。注意：公开仓库读取成功不代表该 PAT 已获写权限。`,6500);}
function bindGithub(){
  $("[data-gh-test]").onclick=()=>testGithub(false);
  const saveBy=(label,commitMsg,stateEl)=>async()=>{
    if(stateEl)stateEl.textContent="保存中…";
    try{config=collectConfig();await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),commitMsg);if(stateEl)stateEl.textContent="已保存";toast(`${label}已保存`);}
    catch(e){if(stateEl)stateEl.textContent="保存失败";toast(e.message,9000);}
  };
  $("[data-save-site]").onclick=saveBy("站点配置","Update site settings",$("[data-site-state]"));
  $("[data-save-theme]").onclick=saveBy("主题外观","Update theme settings",$("[data-theme-state]"));
  $("[data-save-banner]").onclick=saveBy("公告","Update banner",$("[data-banner-state]"));
  $("[data-save-giscus]").onclick=saveBy("Giscus 配置","Update Giscus config",$("[data-giscus-state]"));
  $("[data-save-hero]").onclick=async()=>{const state=$("[data-hero-state]");try{if(state)state.textContent="保存中…";config=collectConfig();await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),"Update hero carousel");if(state)state.textContent="已保存";toast("头图轮播已保存");}catch(e){if(state)state.textContent="保存失败";toast(e.message,9000);}};
  $("[data-push-config]").onclick=async()=>{try{config=collectConfig();await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),"Update site config");toast("配置已提交");}catch(e){toast(e.message,9000);}};
  $("[data-save-password]").onclick=async()=>{try{const v=$("[data-admin-password]").value.trim();if(!v){toast("请输入新的管理密码");return;}if(v.length<4){toast("密码至少 4 位");return;}config=collectConfig();config.admin=config.admin||{};config.admin.password=v;await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),"Update admin password");$("[data-admin-password]").value="";$("[data-password-state]").textContent="已保存";toast("管理密码已保存，下次进入需验证");}catch(e){toast(e.message,9000);}};
  $("[data-push-post]").onclick=async()=>{try{if(!saveSession())return;const files=[{path:`posts/${current.file}.md`,content:b64utf8(currentMd)},{path:"posts/posts.json",content:b64utf8(JSON.stringify(posts,null,2))}];const usedNames=new Set();const uploadTasks=[];for(const kind of["home","article"]){const item=pendingCover[kind];if(!item)continue;if(!gh.token){toast("有待上传的本地图，但尚未连接 GitHub");return;}const ext=extensionFor(item.file);const base=kind==="home"?"cover":"head";const fileSlug=String(current.file||"post").replace(/[^a-z0-9_-]+/gi,"-").toLowerCase()||"post";let next=1;while(usedNames.has(`${base}-${fileSlug}-${String(next).padStart(2,"0")}.${ext}`))next++;const filename=`${base}-${fileSlug}-${String(next).padStart(2,"0")}.${ext}`;usedNames.add(filename);const path=`images/${filename}`;const bytes=new Uint8Array(await item.file.arrayBuffer());let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));files.push({path,content:btoa(bin)});const urlField=kind==="home"?"coverHome":"coverArticle";const colorField=kind==="home"?"coverColorHome":"coverColorArticle";posts=posts.map(p=>p.file===current.file?{...p,[urlField]:path,[colorField]:item.color||p[colorField]||"#c0a089"}:p);current=clone(posts.find(p=>p.file===current.file));files[1]={path:"posts/posts.json",content:b64utf8(JSON.stringify(posts,null,2))};uploadTasks.push(kind);}await githubCommit(files,`Update post: ${current.title}`);for(const kind of uploadTasks){if(pendingCover[kind]?.previewUrl)URL.revokeObjectURL(pendingCover[kind].previewUrl);pendingCover[kind]=null;renderPendingCover(kind);}toast(uploadTasks.length?`文章已提交（已上传 ${uploadTasks.length} 张本地图）`:"文章已提交");}catch(e){toast(e.message,9000);}};
}
async function runDiagnostics(){const box=$("[data-diagnostics]");box.innerHTML="";const checks=[];const probe=async(label,url)=>{try{const r=await fetch(`${url}${url.includes("?")?"&":"?"}t=${Date.now()}`,{cache:"no-store"});checks.push([label,r.ok,`HTTP ${r.status}`]);}catch(e){checks.push([label,false,e.message]);}};await probe("站点配置","assets/site.config.json");await probe("文章索引","posts/posts.json");const comments=config.comments?.enabled?!!(config.comments.repo&&config.comments.repoId&&config.comments.category&&config.comments.categoryId):true;checks.push(["Giscus 配置",comments,config.comments?.enabled?"已启用":"未启用（可选）"]);checks.push(["横幅公告",true,config.banner?.enabled===false?"已停用":"已启用"]);try{const r=await fetch(`/api/likes?post=healthcheck&client=00000000-0000-4000-8000-000000000000`);checks.push(["全站点赞 API",r.ok,r.ok?"可用":`HTTP ${r.status}（可选）`]);}catch{checks.push(["全站点赞 API",false,"不可用（可选）"]);}checks.push(["动态配色",true,document.documentElement.dataset.colorEngine||"fallback"]);box.innerHTML=checks.map(([label,ok,detail])=>`<div class="diagnostic-item ${ok?"ok":"bad"}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(detail)}</span></div>`).join("");}
const ADMIN_UNLOCK_KEY="chuyuan-admin-unlocked";
function initAdmin(){
  const restored=restoreGh();
  bindConfig();
  bindPosts();
  bindGithub();
  loadPosts().catch(e=>toast(e.message,9000));
  $("[data-run-diagnostics]").onclick=runDiagnostics;
  if(restored)testGithub(true);
}
function initLock(){
  const lock=$("[data-admin-lock]");if(!lock)return;
  lock.hidden=true;
  const needs=!!config.admin?.password;
  if(!needs)return;
  if(sessionStorage.getItem(ADMIN_UNLOCK_KEY)==="1")return;
  const shell=document.querySelector(".admin-shell"),appbar=document.querySelector(".top-app-bar");
  lock.hidden=false;if(shell)shell.hidden=true;if(appbar)appbar.hidden=true;
  const input=$("[data-lock-password]"),err=$("[data-lock-error]"),btn=$("[data-lock-unlock]");
  const tryUnlock=()=>{
    if((input.value||"")===config.admin.password){
      sessionStorage.setItem(ADMIN_UNLOCK_KEY,"1");
      lock.hidden=true;if(shell)shell.hidden=false;if(appbar)appbar.hidden=false;
      input.value="";
      initAdmin();toast("已解锁");
    }else{input.value="";err.textContent="密码不正确";input.focus();}
  };
  btn.onclick=tryUnlock;
  input.addEventListener("keydown",e=>{if(e.key==="Enter")tryUnlock();});
  input.focus();
}
(async()=>{try{config=await loadConfig(true);await bootCommon(config);bindTabs();populateConfig();initLock();if(!config.admin?.password||sessionStorage.getItem(ADMIN_UNLOCK_KEY)==="1")initAdmin();}catch(e){console.error(e);toast(e.message,9000);}})();
