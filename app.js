const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

const getUser=()=>JSON.parse(localStorage.getItem("novastream_user")||"null");
const getList=()=>JSON.parse(localStorage.getItem("novastream_list")||"[]");
const getProgress=()=>JSON.parse(localStorage.getItem("novastream_progress")||"{}");

const saveList=l=>localStorage.setItem("novastream_list",JSON.stringify(l));
const saveProgress=p=>localStorage.setItem("novastream_progress",JSON.stringify(p));

function toggleSave(id){
  let list=getList();
  const exists=list.includes(id);
  list=exists?list.filter(i=>i!==id):[...list,id];
  saveList(list);
  showToast(exists?"Eliminado de Mi Lista":"Agregado a Mi Lista");
  renderPage();
  return !exists;
}

function saveItemProgress(id,progress){
  const data=getProgress();
  data[id]=Math.max(data[id]||0,progress);
  saveProgress(data);
}

function getItemProgress(id){
  return getProgress()[id]||0;
}

function login(name,email){
  localStorage.setItem("novastream_user",JSON.stringify({name,email}));
}

function logout(){
  localStorage.removeItem("novastream_user");
  showToast("Sesión cerrada");
  setTimeout(()=>location.href="index.html",900);
}

function showToast(msg){
  const toast=$(".toast");
  if(!toast)return;
  toast.textContent=msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>toast.classList.remove("show"),2300);
}

function requireLogin(){
  if(getUser())return true;
  showToast("Inicia sesión para ver este contenido");
  setTimeout(()=>location.href="login.html",900);
  return false;
}

function openDetail(item){
  if(!requireLogin())return;

  const modal=document.createElement("div");
  modal.className="detail-modal";
  modal.dataset.titleId=item.id;

  const progress=getItemProgress(item.id);
  const saved=getList().includes(item.id);

  modal.innerHTML=`
    <div class="detail-box" role="dialog" aria-modal="true" aria-label="${item.title}">
      <button class="detail-close" aria-label="Cerrar">✕</button>
      <div class="detail-hero" style="background-image:url('${item.poster}')"></div>
      <div class="detail-body">
        <span class="type">${TYPE_LABELS[item.type]}</span>
        <h2>${item.title}</h2>
        <p class="detail-meta">${item.genre} · ${item.year} · ★ ${item.rating}</p>
        <p class="detail-desc">Disfruta de ${item.title}, una producción ${TYPE_LABELS[item.type].toLowerCase()} de ${item.genre}. Calidad HD, subtítulos y audio optimizado.</p>
        <div class="detail-progress">
          <span>Progreso: ${progress}%</span>
          <div class="bar"><i style="width:${progress}%"></i></div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary play-now">▶ Reproducir</button>
          <button class="btn btn-ghost save-detail">${saved?"✓ En Mi Lista":"❤ Guardar"}</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow="hidden";

  requestAnimationFrame(()=>modal.classList.add("open"));
  modal.querySelector(".detail-close").focus();

  const close=()=>closeDetail(modal);

  modal.querySelector(".detail-close").addEventListener("click",close);
  modal.addEventListener("click",e=>{if(e.target===modal)close();});

  modal.querySelector(".save-detail").addEventListener("click",()=>{
    const nowSaved=toggleSave(item.id);
    modal.querySelector(".save-detail").textContent=nowSaved?"✓ En Mi Lista":"❤ Guardar";
  });

  modal.querySelector(".play-now").addEventListener("click",()=>{
    saveItemProgress(item.id,Math.max(progress,10));
    showToast(`Reproduciendo: ${item.title}`);
    close();
    renderPage();
  });

  document.addEventListener("keydown",function esc(e){
    if(e.key==="Escape"){
      close();
      document.removeEventListener("keydown",esc);
    }
  });
}

function closeDetail(modal){
  modal.classList.remove("open");
  setTimeout(()=>{
    modal.remove();
    document.body.style.overflow="";
  },350);
}

function createCard(item){
  const saved=getList().includes(item.id);
  const progress=getItemProgress(item.id);

  const card=document.createElement("article");
  card.className="card reveal";

  card.innerHTML=`
    <div class="poster" style="background-image:url('${item.poster}')" role="button" tabindex="0" aria-label="Ver ${item.title}">
      <span class="type">${TYPE_LABELS[item.type]}</span>
      <span class="rating">★ ${item.rating}</span>
    </div>
    <div class="info">
      <h3>${item.title}</h3>
      <p>${item.genre} · ${item.year}</p>
      <div class="actions">
        <span style="font-size:.75rem;color:var(--muted)">${progress>0?`Continuar · ${progress}%`:"Ver ahora"}</span>
        <div style="display:flex;gap:.4rem">
          <button class="mini save ${saved?"saved":""}" aria-label="Guardar ${item.title}">${saved?"✓":"❤"}</button>
          <button class="mini play" aria-label="Reproducir ${item.title}">▶</button>
        </div>
      </div>
    </div>`;

  card.querySelector(".poster").addEventListener("click",()=>openDetail(item));
  card.querySelector(".poster").addEventListener("keydown",e=>{
    if(e.key==="Enter"||e.key===" "){e.preventDefault();openDetail(item);}
  });

  card.querySelector(".save").addEventListener("click",()=>{
    const nowSaved=toggleSave(item.id);
    card.querySelector(".save").textContent=nowSaved?"✓":"❤";
    card.querySelector(".save").classList.toggle("saved",nowSaved);
  });

  card.querySelector(".play").addEventListener("click",()=>openDetail(item));

  return card;
}

function renderGrid(selector,items,emptyText){
  const grid=$(selector);
  if(!grid)return;

  grid.innerHTML="";

  if(!items.length){
    const msg=document.createElement("p");
    msg.className="empty-msg";
    msg.textContent=emptyText||"No hay contenido disponible.";
    grid.appendChild(msg);
    return;
  }

  items.forEach(item=>grid.appendChild(createCard(item)));
}

function renderPage(){
  const page=document.body.dataset.page;
  const user=getUser();
  const authBtn=$("#authBtn");
  const avatar=$("#avatar");

  if(authBtn&&avatar){
    if(user){
      authBtn.style.display="none";
      avatar.style.display="grid";
      avatar.textContent=user.name.charAt(0).toUpperCase();
    }else{
      authBtn.style.display="inline-flex";
      avatar.style.display="none";
    }
  }

  if(page==="home"){
    renderGrid("#continueGrid",CATALOG.filter(i=>getItemProgress(i.id)>0),"Aún no has comenzado a ver ningún título.");
    renderGrid("#popularGrid",[...CATALOG].sort((a,b)=>b.popularity-a.popularity).slice(0,8),"No hay títulos populares.");
  }

  if(["peliculas","series","anime","documentales","infantil"].includes(page)){
    renderGrid("#categoryGrid",CATALOG.filter(i=>i.type===page),"No hay títulos en esta categoría.");
  }

  if(page==="mi-lista"){
    renderGrid("#listGrid",CATALOG.filter(i=>getList().includes(i.id)),"Tu lista está vacía. Guarda títulos con ❤️.");
  }
}

function initHeader(){
  const page=document.body.dataset.page;

  $$(".menu a").forEach(link=>{
    if(link.dataset.page===page)link.classList.add("active");
  });

  const authBtn=$("#authBtn");
  const avatar=$("#avatar");

  if(authBtn)authBtn.addEventListener("click",()=>location.href="login.html");
  if(avatar)avatar.addEventListener("click",logout);
}

function initReveal(){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12});

  $$(".reveal").forEach(el=>observer.observe(el));
}

document.addEventListener("DOMContentLoaded",()=>{
  initHeader();
  renderPage();
  initReveal();

  const year=$("#year");
  if(year)year.textContent=new Date().getFullYear();
});