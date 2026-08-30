let products = [];
let settings = {};
let cart = JSON.parse(localStorage.getItem('safyam_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('safyam_wishlist') || '[]');
let activeCategory = "all";
let searchTerm = "";
let sortMode = "featured";
let testimonialIndex = 0;
let supabaseClient = null;

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const cfg = window.SAFYAM_CONFIG || {};
const money = n => new Intl.NumberFormat(cfg.locale || "en-NG",{style:"currency",currency:cfg.currency || "NGN",maximumFractionDigits:0}).format(Number(n)||0).replace("NGN","₦");

async function initData(){
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  if(configured){
    try{
      supabaseClient = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
      const [{data:productRows,error:pErr},{data:settingRows,error:sErr}] = await Promise.all([
        supabaseClient.from(cfg.productsTable || 'products').select('*').eq('active',true).order('featured',{ascending:true}),
        supabaseClient.from(cfg.settingsTable || 'store_settings').select('*').limit(1).maybeSingle()
      ]);
      if(pErr) throw pErr;
      products = (productRows || []).map(normalizeProduct);
      if(!sErr && settingRows) settings = settingRows;
    }catch(err){console.warn('Supabase unavailable; using fallback data.',err); await loadFallback();}
  } else {
    await loadFallback();
  }
  applySettings(); renderProducts(); updateCart(); updateWishlist(); setTestimonial(0);
}

async function loadFallback(){
  const localProducts = localStorage.getItem('safyam_admin_products');
  const localSettings = localStorage.getItem('safyam_admin_settings');
  if(localProducts){
    try{products=JSON.parse(localProducts).filter(p=>p.active!==false).map(normalizeProduct)}catch{}
  }
  if(!products.length){
    try{const r=await fetch('data/products.json',{cache:'no-store'});products=(await r.json()).filter(p=>p.active!==false).map(normalizeProduct)}catch(err){console.error(err)}
  }
  if(localSettings){try{settings=JSON.parse(localSettings)}catch{}}
  if(!Object.keys(settings).length){
    try{const r=await fetch('data/settings.json',{cache:'no-store'});settings=await r.json()}catch{}
  }
}
function normalizeProduct(p){return {...p,id:Number(p.id),price:Number(p.price)||0,compareAt:Number(p.compareAt ?? p.compare_at)||0,featured:Number(p.featured)||999,stock:Number(p.stock ?? 0),tags:Array.isArray(p.tags)?p.tags:(typeof p.tags==='string'?p.tags.split(',').map(x=>x.trim()).filter(Boolean):[]),image:p.image||p.image_url||''}}
function applySettings(){
  if(settings.heroTitle){const h=$('#heroTitle');if(h)h.innerHTML=settings.heroTitle.replace(/\n/g,'<br>')}
  if(settings.heroText){const p=$('#heroText');if(p)p.textContent=settings.heroText}
  const ann=$('.announcement-track');if(ann && settings.announcement){const parts=settings.announcement.split('•').map(x=>x.trim()).filter(Boolean);ann.innerHTML=[...parts,...parts].map(x=>`<span>${escapeHtml(x)}</span><i>◆</i>`).join('')}
}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function imageBlock(p,cls='product-art'){return p.image?`<div class="${cls} has-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt||p.name)}" loading="lazy" onerror="this.closest('.has-image').classList.remove('has-image');this.remove()"></div>`:`<div class="${cls} tone-${(p.id%12)||1}"><span class="product-symbol">S</span></div>`}
function stockLabel(p){if(p.stock<=0)return '<span class="stock-pill out">Made to order</span>';if(p.stock<=3)return `<span class="stock-pill low">Only ${p.stock} left</span>`;return '<span class="stock-pill">Available</span>'}

function visibleProducts(){
  let list=products.filter(p=>(activeCategory==='all'||p.category===activeCategory)&&(`${p.name} ${p.category} ${p.desc||''} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())));
  if(sortMode==='low')list.sort((a,b)=>a.price-b.price); if(sortMode==='high')list.sort((a,b)=>b.price-a.price); if(sortMode==='name')list.sort((a,b)=>a.name.localeCompare(b.name)); if(sortMode==='newest')list.sort((a,b)=>b.id-a.id); if(sortMode==='featured')list.sort((a,b)=>a.featured-b.featured); return list;
}
function renderProducts(){
  const grid=$('#productGrid'); if(!grid)return; const list=visibleProducts();
  grid.innerHTML=list.map(p=>`<article class="product-card"><div class="product-media" data-view="${p.id}" role="button" tabindex="0" aria-label="View ${escapeHtml(p.name)}">${imageBlock(p)}<span class="product-badge">${escapeHtml(p.badge||'Safyam')}</span><button class="wishlist-btn ${wishlist.includes(p.id)?'active':''}" type="button" data-wish="${p.id}" aria-label="Save ${escapeHtml(p.name)}">${wishlist.includes(p.id)?'♥':'♡'}</button><button class="quick-view" type="button" data-view="${p.id}">Quick view</button></div><div class="product-info"><div class="product-title-row"><h3>${escapeHtml(p.name)}</h3><strong>${money(p.price)}</strong></div><p>${escapeHtml(p.desc||'')}</p><div class="product-bottom">${stockLabel(p)}<button class="add-link" type="button" data-add="${p.id}">Add to bag</button></div>${p.imageCredit?`<div class="product-credit">${escapeHtml(p.imageCredit)}</div>`:''}</div></article>`).join('');
  $('#emptyState').hidden=list.length>0;
}
function persist(){localStorage.setItem('safyam_cart',JSON.stringify(cart));localStorage.setItem('safyam_wishlist',JSON.stringify(wishlist))}
function productById(id){return products.find(x=>x.id===Number(id))}
function addToCart(id,qty=1){const p=productById(id);if(!p)return;const row=cart.find(x=>x.id===p.id);if(row)row.qty+=qty;else cart.push({id:p.id,qty});persist();updateCart();showToast('Added to bag')}
function changeQty(id,delta){const row=cart.find(x=>x.id===id);if(!row)return;row.qty+=delta;if(row.qty<=0)cart=cart.filter(x=>x.id!==id);persist();updateCart()}
function removeCart(id){cart=cart.filter(x=>x.id!==id);persist();updateCart()}
function updateCart(){
  cart=cart.filter(r=>productById(r.id)); const count=cart.reduce((a,b)=>a+b.qty,0);const total=cart.reduce((sum,row)=>sum+productById(row.id).price*row.qty,0);$('#cartCount').textContent=count;$('#cartSummary').textContent=`${count} item${count===1?'':'s'}`;$('#cartTotal').textContent=money(total);
  $('#cartItems').innerHTML=cart.map(row=>{const p=productById(row.id);return `<div class="cart-item">${imageBlock(p,'cart-thumb')}<div class="cart-copy"><h4>${escapeHtml(p.name)}</h4><small>${money(p.price)}</small><div class="qty-row"><button type="button" data-qty="${p.id}" data-delta="-1">−</button><span>${row.qty}</span><button type="button" data-qty="${p.id}" data-delta="1">+</button></div></div><button class="remove-item" type="button" data-remove="${p.id}">Remove</button></div>`}).join('');$('#cartEmpty').hidden=cart.length>0;$('.drawer-foot').style.display=cart.length?'block':'none';
}
function toggleWishlist(id){id=Number(id);wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];persist();renderProducts();updateWishlist();showToast(wishlist.includes(id)?'Saved for later':'Removed from saved')}
function updateWishlist(){wishlist=wishlist.filter(id=>productById(id));$('#wishlistCount').textContent=wishlist.length;$('#wishlistSummary').textContent=`${wishlist.length} item${wishlist.length===1?'':'s'}`;$('#wishlistItems').innerHTML=wishlist.map(id=>{const p=productById(id);return `<div class="wishlist-item">${imageBlock(p,'wishlist-thumb')}<div class="wishlist-copy"><h4>${escapeHtml(p.name)}</h4><small>${money(p.price)}</small><div class="qty-row"><button type="button" data-add="${p.id}">Add to bag</button></div></div><button class="remove-item" type="button" data-wish="${p.id}">Remove</button></div>`}).join('');$('#wishlistEmpty').hidden=wishlist.length>0}

const drawerOverlay=$('#drawerOverlay'),cartDrawer=$('#cartDrawer'),wishlistDrawer=$('#wishlistDrawer'),productModal=$('#productModal'),toast=$('#toast');
function showOverlay(){drawerOverlay.hidden=false;document.body.classList.add('locked')}function hideOverlayIfClear(){if(!cartDrawer.classList.contains('open')&&!wishlistDrawer.classList.contains('open')&&!productModal.classList.contains('open')){drawerOverlay.hidden=true;document.body.classList.remove('locked')}}function openDrawer(el){[cartDrawer,wishlistDrawer].forEach(x=>{x.classList.remove('open');x.setAttribute('aria-hidden','true')});el.classList.add('open');el.setAttribute('aria-hidden','false');showOverlay()}function closeDrawers(){[cartDrawer,wishlistDrawer].forEach(x=>{x.classList.remove('open');x.setAttribute('aria-hidden','true')});hideOverlayIfClear()}
function openProduct(id){const p=productById(id);if(!p)return;$('#modalContent').innerHTML=`<div class="modal-grid">${imageBlock(p,'modal-art')}<div class="modal-copy"><p class="eyebrow dark">${escapeHtml(p.badge||'Safyam')} / ${escapeHtml(p.category)}</p><h2 id="modalTitle">${escapeHtml(p.name)}</h2><p class="modal-desc">${escapeHtml(p.desc||'')}</p><div class="modal-price">${money(p.price)}</div><div class="modal-details"><span>${stockLabel(p)}</span><span>Nationwide delivery available</span><span>Final availability confirmed on order</span></div>${p.imageCredit?`<p class="product-credit">${escapeHtml(p.imageCredit)}</p>`:''}<div class="modal-actions"><button class="modal-add" type="button" data-add="${p.id}">Add to bag</button><button class="modal-wish ${wishlist.includes(p.id)?'active':''}" type="button" data-wish="${p.id}">${wishlist.includes(p.id)?'♥':'♡'}</button></div></div></div>`;productModal.classList.add('open');productModal.setAttribute('aria-hidden','false');showOverlay()}
function closeProduct(){productModal.classList.remove('open');productModal.setAttribute('aria-hidden','true');hideOverlayIfClear()}function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800)}

$('#productGrid').addEventListener('click',e=>{const wish=e.target.closest('[data-wish]');if(wish){e.stopPropagation();toggleWishlist(wish.dataset.wish);return}const add=e.target.closest('[data-add]');if(add){e.stopPropagation();addToCart(add.dataset.add);return}const view=e.target.closest('[data-view]');if(view)openProduct(view.dataset.view)});
$('#productGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.product-media')){e.preventDefault();openProduct(e.target.dataset.view)}});
document.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add&&!$('#productGrid').contains(add)){addToCart(add.dataset.add);if(productModal.contains(add))closeProduct()}const wish=e.target.closest('[data-wish]');if(wish&&!$('#productGrid').contains(wish)){toggleWishlist(wish.dataset.wish);if(productModal.contains(wish))openProduct(wish.dataset.wish)}const remove=e.target.closest('[data-remove]');if(remove)removeCart(Number(remove.dataset.remove));const qty=e.target.closest('[data-qty]');if(qty)changeQty(Number(qty.dataset.qty),Number(qty.dataset.delta))});
$$('#categoryTabs button').forEach(btn=>btn.addEventListener('click',()=>{activeCategory=btn.dataset.category;$$('#categoryTabs button').forEach(b=>b.classList.toggle('active',b===btn));renderProducts()}));$('#sortSelect').addEventListener('change',e=>{sortMode=e.target.value;renderProducts()});$$('[data-shop-filter]').forEach(a=>a.addEventListener('click',()=>{activeCategory=a.dataset.shopFilter;$$('#categoryTabs button').forEach(b=>b.classList.toggle('active',b.dataset.category===activeCategory));renderProducts()}));
$('#cartTrigger').addEventListener('click',()=>openDrawer(cartDrawer));$('#cartClose').addEventListener('click',closeDrawers);$('#wishlistTrigger').addEventListener('click',()=>openDrawer(wishlistDrawer));$('#wishlistClose').addEventListener('click',closeDrawers);$('#modalClose').addEventListener('click',closeProduct);drawerOverlay.addEventListener('click',()=>{closeDrawers();closeProduct();closeMenu()});$('#emptyShopBtn').addEventListener('click',()=>{closeDrawers();$('#shop').scrollIntoView({behavior:'smooth'})});
$('#checkoutBtn').addEventListener('click',()=>{if(!cart.length)return showToast('Your bag is empty');const lines=cart.map(row=>{const p=productById(row.id);return `${row.qty} × ${p.name} — ${money(p.price*row.qty)}`});const total=cart.reduce((sum,row)=>sum+productById(row.id).price*row.qty,0);closeDrawers();$('#contact').scrollIntoView({behavior:'smooth'});$('[name="interest"]').value='Custom order';$('[name="message"]').value=`Hello Safyam, I would like to order:\n\n${lines.join('\n')}\n\nEstimated subtotal: ${money(total)}\n\nPlease confirm availability, final total and delivery details.`;showToast('Order request prepared')});
const menu=$('#mobileMenu'),menuTrigger=$('#menuTrigger');function openMenu(){menu.classList.add('open');menu.setAttribute('aria-hidden','false');menuTrigger.setAttribute('aria-expanded','true');showOverlay()}function closeMenu(){menu.classList.remove('open');menu.setAttribute('aria-hidden','true');menuTrigger.setAttribute('aria-expanded','false');hideOverlayIfClear()}menuTrigger.addEventListener('click',openMenu);$('#menuClose').addEventListener('click',closeMenu);$$('#mobileMenu a').forEach(a=>a.addEventListener('click',closeMenu));
const searchOverlay=$('#searchOverlay'),globalSearch=$('#globalSearch');function openSearch(){searchOverlay.classList.add('open');searchOverlay.setAttribute('aria-hidden','false');setTimeout(()=>globalSearch.focus(),220)}function closeSearch(){searchOverlay.classList.remove('open');searchOverlay.setAttribute('aria-hidden','true')}$('#searchTrigger').addEventListener('click',openSearch);$('#searchClose').addEventListener('click',closeSearch);globalSearch.addEventListener('input',e=>{searchTerm=e.target.value.trim();$('#searchFeedback').textContent=searchTerm?`${visibleProducts().length} result${visibleProducts().length===1?'':'s'} for “${searchTerm}”`:'Search by product, category or style.';renderProducts()});$$('[data-search-term]').forEach(b=>b.addEventListener('click',()=>{globalSearch.value=b.dataset.searchTerm;globalSearch.dispatchEvent(new Event('input'));closeSearch();$('#shop').scrollIntoView({behavior:'smooth'})}));
function setTestimonial(i){const all=$$('.testimonial');testimonialIndex=(i+all.length)%all.length;all.forEach((x,n)=>x.classList.toggle('active',n===testimonialIndex));$('#testimonialIndex').textContent=`${String(testimonialIndex+1).padStart(2,'0')} / ${String(all.length).padStart(2,'0')}`}$('#testimonialPrev').addEventListener('click',()=>setTestimonial(testimonialIndex-1));$('#testimonialNext').addEventListener('click',()=>setTestimonial(testimonialIndex+1));
$('#contactForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget);const msg=`SAFYAM ENQUIRY\n\nName: ${d.get('name')}\nPhone / WhatsApp: ${d.get('phone')}\nEmail: ${d.get('email')||'Not provided'}\nInterest: ${d.get('interest')}\n\nMessage:\n${d.get('message')}`;if(settings.whatsapp){const num=settings.whatsapp.replace(/\D/g,'');window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,'_blank');$('#formStatus').textContent='Opening WhatsApp…'}else{$('#enquiryOutput').textContent=`${msg}\n\nAdd Safyam’s WhatsApp number in Admin → Store Settings to send this directly.`;$('#enquiryOutput').hidden=false;$('#formStatus').textContent='Enquiry prepared below.'}});$('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();$('#newsletterStatus').textContent='Email capture is ready for your preferred marketing platform.'});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});$$('.reveal').forEach(el=>observer.observe(el));window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;$('#scrollProgress').style.width=`${max>0?(scrollY/max)*100:0}%`;$('#siteHeader').classList.toggle('scrolled',scrollY>80)},{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawers();closeProduct();closeMenu();closeSearch()}});$('#year').textContent=new Date().getFullYear();
initData();


// V4 mobile app navigation bridge
(() => {
  const byId = (id) => document.getElementById(id);
  const bridge = (mobileId, desktopId) => {
    const m = byId(mobileId), d = byId(desktopId);
    if (m && d) m.addEventListener('click', () => d.click());
  };
  bridge('mobileSearchBtn','searchTrigger');
  bridge('mobileWishBtn','wishlistTrigger');
  bridge('mobileBagBtn','cartTrigger');
  const syncBag = () => { const src=byId('cartCount'), dst=byId('mobileBagCount'); if(src&&dst) dst.textContent=src.textContent; };
  syncBag();
  const src=byId('cartCount'); if(src) new MutationObserver(syncBag).observe(src,{childList:true,subtree:true,characterData:true});
  const links=[...document.querySelectorAll('[data-app-nav]')];
  links.forEach(link=>link.addEventListener('click',()=>{links.forEach(x=>x.classList.remove('active'));link.classList.add('active')}));
})();
