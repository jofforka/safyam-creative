const products = [
  {id:1,name:"Royal Ember Beaded Bag",category:"beads",price:48500,badge:"Signature",symbol:"S",tone:1,featured:1,desc:"A hand-finished statement bag with jewel-inspired beadwork and occasion-ready presence."},
  {id:2,name:"Ivory Halo Necklace",category:"beads",price:28500,badge:"New",symbol:"○",tone:2,featured:2,desc:"Layered beadwork designed to frame the neckline with sculptural softness."},
  {id:3,name:"Noir Sculptural Wrap",category:"fashion",price:22000,badge:"Editor’s Pick",symbol:"≈",tone:3,featured:3,desc:"A polished wrap with fluid drape for elevated everyday and event styling."},
  {id:4,name:"Midnight Bead Collar",category:"accessories",price:18500,badge:"Limited",symbol:"◌",tone:4,featured:4,desc:"A graphic statement collar combining dark tones with precise hand-led detail."},
  {id:5,name:"Amber Crown Turban",category:"fashion",price:16500,badge:"Popular",symbol:"∿",tone:5,featured:5,desc:"Sculpted satin styling with a structured crown and effortless occasion polish."},
  {id:6,name:"Orchid Loop Bracelet",category:"accessories",price:9800,badge:"Giftable",symbol:"∞",tone:6,featured:6,desc:"A refined hand-strung bracelet created for layering, gifting and daily wear."},
  {id:7,name:"Golden Hour Gift Box",category:"gifts",price:39500,badge:"Gift Edit",symbol:"□",tone:7,featured:7,desc:"A curated presentation box designed for birthdays, milestones and thoughtful moments."},
  {id:8,name:"Sandstone Mini Tote",category:"fashion",price:32000,badge:"New",symbol:"▱",tone:8,featured:8,desc:"A compact structured tote balancing clean form, tactile detail and practical styling."},
  {id:9,name:"Obsidian Statement Set",category:"beads",price:52500,badge:"Signature",symbol:"◇",tone:9,featured:9,desc:"A coordinated necklace and bracelet set designed as a complete visual statement."},
  {id:10,name:"Olive Twist Headpiece",category:"fashion",price:14500,badge:"New",symbol:"∽",tone:10,featured:10,desc:"A soft sculpted headpiece with rich colour and a confident contemporary silhouette."},
  {id:11,name:"Rose Quartz Wrist Stack",category:"accessories",price:12000,badge:"Bestseller",symbol:"◉",tone:11,featured:11,desc:"A layered bracelet stack combining soft tones with a subtle handcrafted finish."},
  {id:12,name:"The Safyam Keepsake",category:"gifts",price:26000,badge:"Curated",symbol:"S",tone:12,featured:12,desc:"A refined gift selection for someone who appreciates detail, originality and presentation."}
];

let cart = [];
let wishlist = [];
let activeCategory = "all";
let searchTerm = "";
let sortMode = "featured";
let testimonialIndex = 0;

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n).replace("NGN","₦");
const productGrid = $("#productGrid");
const drawerOverlay = $("#drawerOverlay");
const cartDrawer = $("#cartDrawer");
const wishlistDrawer = $("#wishlistDrawer");
const productModal = $("#productModal");
const toast = $("#toast");

function visibleProducts(){
  let list = products.filter(p => (activeCategory === "all" || p.category === activeCategory) && (`${p.name} ${p.category} ${p.desc}`.toLowerCase().includes(searchTerm.toLowerCase())));
  if(sortMode === "low") list.sort((a,b)=>a.price-b.price);
  if(sortMode === "high") list.sort((a,b)=>b.price-a.price);
  if(sortMode === "name") list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sortMode === "newest") list.sort((a,b)=>b.id-a.id);
  if(sortMode === "featured") list.sort((a,b)=>a.featured-b.featured);
  return list;
}

function renderProducts(){
  const list = visibleProducts();
  productGrid.innerHTML = list.map(p=>`
    <article class="product-card">
      <div class="product-media" data-view="${p.id}" role="button" tabindex="0" aria-label="View ${p.name}">
        <div class="product-art tone-${p.tone}"><span class="product-symbol">${p.symbol}</span></div>
        <span class="product-badge">${p.badge}</span>
        <button class="wishlist-btn ${wishlist.includes(p.id)?"active":""}" type="button" data-wish="${p.id}" aria-label="${wishlist.includes(p.id)?"Remove":"Save"} ${p.name}">${wishlist.includes(p.id)?"♥":"♡"}</button>
        <button class="quick-view" type="button" data-view="${p.id}">Quick view</button>
      </div>
      <div class="product-info">
        <div class="product-title-row"><h3>${p.name}</h3><strong>${money(p.price)}</strong></div>
        <p>${p.desc}</p>
        <div class="product-bottom"><span class="product-category">${p.category}</span><button class="add-link" type="button" data-add="${p.id}">Add to bag</button></div>
      </div>
    </article>`).join("");
  $("#emptyState").hidden = list.length > 0;
}

function addToCart(id,qty=1){
  const row = cart.find(x=>x.id===id);
  if(row) row.qty += qty; else cart.push({id,qty});
  updateCart(); showToast("Added to bag");
}
function changeQty(id,delta){
  const row=cart.find(x=>x.id===id); if(!row)return;
  row.qty += delta; if(row.qty<=0) cart=cart.filter(x=>x.id!==id); updateCart();
}
function removeCart(id){cart=cart.filter(x=>x.id!==id);updateCart()}
function updateCart(){
  const count=cart.reduce((a,b)=>a+b.qty,0);
  const total=cart.reduce((sum,row)=>sum+products.find(p=>p.id===row.id).price*row.qty,0);
  $("#cartCount").textContent=count; $("#cartSummary").textContent=`${count} item${count===1?"":"s"}`; $("#cartTotal").textContent=money(total);
  const container=$("#cartItems");
  container.innerHTML=cart.map(row=>{const p=products.find(x=>x.id===row.id);return `<div class="cart-item"><div class="cart-thumb tone-${p.tone}">${p.symbol}</div><div class="cart-copy"><h4>${p.name}</h4><small>${money(p.price)}</small><div class="qty-row"><button type="button" data-qty="${p.id}" data-delta="-1">−</button><span>${row.qty}</span><button type="button" data-qty="${p.id}" data-delta="1">+</button></div></div><button class="remove-item" type="button" data-remove="${p.id}">Remove</button></div>`}).join("");
  $("#cartEmpty").hidden=cart.length>0; $(".drawer-foot").style.display=cart.length?"block":"none";
}
function toggleWishlist(id){
  wishlist = wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];
  renderProducts(); updateWishlist(); showToast(wishlist.includes(id)?"Saved for later":"Removed from saved");
}
function updateWishlist(){
  $("#wishlistCount").textContent=wishlist.length; $("#wishlistSummary").textContent=`${wishlist.length} item${wishlist.length===1?"":"s"}`;
  $("#wishlistItems").innerHTML=wishlist.map(id=>{const p=products.find(x=>x.id===id);return `<div class="wishlist-item"><div class="wishlist-thumb tone-${p.tone}">${p.symbol}</div><div class="wishlist-copy"><h4>${p.name}</h4><small>${money(p.price)}</small><div class="qty-row"><button type="button" data-add="${p.id}">Add to bag</button></div></div><button class="remove-item" type="button" data-wish="${p.id}">Remove</button></div>`}).join("");
  $("#wishlistEmpty").hidden=wishlist.length>0;
}

function showOverlay(){drawerOverlay.hidden=false;document.body.classList.add("locked")}
function hideOverlayIfClear(){if(!cartDrawer.classList.contains("open")&&!wishlistDrawer.classList.contains("open")&&!productModal.classList.contains("open")){drawerOverlay.hidden=true;document.body.classList.remove("locked")}}
function openDrawer(el){[cartDrawer,wishlistDrawer].forEach(x=>{x.classList.remove("open");x.setAttribute("aria-hidden","true")});el.classList.add("open");el.setAttribute("aria-hidden","false");showOverlay()}
function closeDrawers(){[cartDrawer,wishlistDrawer].forEach(x=>{x.classList.remove("open");x.setAttribute("aria-hidden","true")});hideOverlayIfClear()}

function openProduct(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  $("#modalContent").innerHTML=`<div class="modal-grid"><div class="modal-art tone-${p.tone}">${p.symbol}</div><div class="modal-copy"><p class="eyebrow dark">${p.badge} / ${p.category}</p><h2 id="modalTitle">${p.name}</h2><p class="modal-desc">${p.desc}</p><div class="modal-price">${money(p.price)}</div><div class="modal-details"><span>Handcrafted / curated finish</span><span>Nationwide delivery available</span><span>Final availability confirmed on order</span></div><div class="modal-actions"><button class="modal-add" type="button" data-add="${p.id}">Add to bag</button><button class="modal-wish ${wishlist.includes(p.id)?"active":""}" type="button" data-wish="${p.id}" aria-label="Save product">${wishlist.includes(p.id)?"♥":"♡"}</button></div></div></div>`;
  productModal.classList.add("open");productModal.setAttribute("aria-hidden","false");showOverlay();
}
function closeProduct(){productModal.classList.remove("open");productModal.setAttribute("aria-hidden","true");hideOverlayIfClear()}
function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1800)}

productGrid.addEventListener("click",e=>{
  const wish=e.target.closest("[data-wish]"); if(wish){e.stopPropagation();toggleWishlist(Number(wish.dataset.wish));return}
  const add=e.target.closest("[data-add]"); if(add){e.stopPropagation();addToCart(Number(add.dataset.add));return}
  const view=e.target.closest("[data-view]"); if(view) openProduct(Number(view.dataset.view));
});
productGrid.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches(".product-media")){e.preventDefault();openProduct(Number(e.target.dataset.view))}});

document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"); if(add && !productGrid.contains(add)){addToCart(Number(add.dataset.add));if(productModal.contains(add))closeProduct()}
  const wish=e.target.closest("[data-wish]"); if(wish && !productGrid.contains(wish)){toggleWishlist(Number(wish.dataset.wish));if(productModal.contains(wish))openProduct(Number(wish.dataset.wish))}
  const remove=e.target.closest("[data-remove]"); if(remove)removeCart(Number(remove.dataset.remove));
  const qty=e.target.closest("[data-qty]"); if(qty)changeQty(Number(qty.dataset.qty),Number(qty.dataset.delta));
});

$$('#categoryTabs button').forEach(btn=>btn.addEventListener('click',()=>{activeCategory=btn.dataset.category;$$('#categoryTabs button').forEach(b=>b.classList.toggle('active',b===btn));renderProducts()}));
$("#sortSelect").addEventListener("change",e=>{sortMode=e.target.value;renderProducts()});
$$('[data-shop-filter]').forEach(a=>a.addEventListener('click',()=>{activeCategory=a.dataset.shopFilter;$$('#categoryTabs button').forEach(b=>b.classList.toggle('active',b.dataset.category===activeCategory));renderProducts()}));

$("#cartTrigger").addEventListener("click",()=>openDrawer(cartDrawer)); $("#cartClose").addEventListener("click",closeDrawers);
$("#wishlistTrigger").addEventListener("click",()=>openDrawer(wishlistDrawer)); $("#wishlistClose").addEventListener("click",closeDrawers);
$("#modalClose").addEventListener("click",closeProduct); drawerOverlay.addEventListener("click",()=>{closeDrawers();closeProduct();closeMenu()});
$("#emptyShopBtn").addEventListener("click",()=>{closeDrawers();$("#shop").scrollIntoView({behavior:"smooth"})});

$("#checkoutBtn").addEventListener("click",()=>{
  if(!cart.length)return showToast("Your bag is empty");
  const lines=cart.map(row=>{const p=products.find(x=>x.id===row.id);return `${row.qty} × ${p.name} — ${money(p.price*row.qty)}`});
  const total=cart.reduce((sum,row)=>sum+products.find(p=>p.id===row.id).price*row.qty,0);
  closeDrawers();$("#contact").scrollIntoView({behavior:"smooth"});
  $("[name='interest']").value="Custom order";$("[name='message']").value=`Hello Safyam, I would like to order:\n\n${lines.join("\n")}\n\nEstimated subtotal: ${money(total)}\n\nPlease confirm availability, final total and delivery details.`;showToast("Order request prepared");
});

const menu=$("#mobileMenu"),menuTrigger=$("#menuTrigger");
function openMenu(){menu.classList.add("open");menu.setAttribute("aria-hidden","false");menuTrigger.setAttribute("aria-expanded","true");showOverlay()}
function closeMenu(){menu.classList.remove("open");menu.setAttribute("aria-hidden","true");menuTrigger.setAttribute("aria-expanded","false");hideOverlayIfClear()}
menuTrigger.addEventListener("click",openMenu);$("#menuClose").addEventListener("click",closeMenu);$$('#mobileMenu a').forEach(a=>a.addEventListener('click',closeMenu));

const searchOverlay=$("#searchOverlay"),globalSearch=$("#globalSearch");
function openSearch(){searchOverlay.classList.add("open");searchOverlay.setAttribute("aria-hidden","false");setTimeout(()=>globalSearch.focus(),220)}
function closeSearch(){searchOverlay.classList.remove("open");searchOverlay.setAttribute("aria-hidden","true")}
$("#searchTrigger").addEventListener("click",openSearch);$("#searchClose").addEventListener("click",closeSearch);
globalSearch.addEventListener("input",e=>{searchTerm=e.target.value.trim();$("#searchFeedback").textContent=searchTerm?`${visibleProducts().length} result${visibleProducts().length===1?"":"s"} for “${searchTerm}”`:"Search by product, category or style.";renderProducts()});
$$('[data-search-term]').forEach(b=>b.addEventListener('click',()=>{globalSearch.value=b.dataset.searchTerm;globalSearch.dispatchEvent(new Event('input'));closeSearch();$("#shop").scrollIntoView({behavior:"smooth"})}));

function setTestimonial(i){const all=$$('.testimonial');testimonialIndex=(i+all.length)%all.length;all.forEach((x,n)=>x.classList.toggle('active',n===testimonialIndex));$("#testimonialIndex").textContent=`${String(testimonialIndex+1).padStart(2,'0')} / ${String(all.length).padStart(2,'0')}`}
$("#testimonialPrev").addEventListener("click",()=>setTestimonial(testimonialIndex-1));$("#testimonialNext").addEventListener("click",()=>setTestimonial(testimonialIndex+1));

$("#contactForm").addEventListener("submit",e=>{e.preventDefault();const d=new FormData(e.currentTarget);const msg=`SAFYAM ENQUIRY\n\nName: ${d.get("name")}\nPhone / WhatsApp: ${d.get("phone")}\nEmail: ${d.get("email")||"Not provided"}\nInterest: ${d.get("interest")}\n\nMessage:\n${d.get("message")}`;$("#enquiryOutput").textContent=`${msg}\n\nThis enquiry is ready to connect to Safyam’s WhatsApp number, email or form backend when those details are supplied.`;$("#enquiryOutput").hidden=false;$("#formStatus").textContent="Enquiry prepared below.";$("#enquiryOutput").scrollIntoView({behavior:"smooth",block:"nearest"})});
$("#newsletterForm").addEventListener("submit",e=>{e.preventDefault();$("#newsletterStatus").textContent="Preview mode — connect this field to Mailchimp, Brevo or another email platform before launch."});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.08});$$('.reveal').forEach(el=>observer.observe(el));
window.addEventListener("scroll",()=>{const max=document.documentElement.scrollHeight-innerHeight;$("#scrollProgress").style.width=`${max>0?(scrollY/max)*100:0}%`;$("#siteHeader").classList.toggle("scrolled",scrollY>80)},{passive:true});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawers();closeProduct();closeMenu();closeSearch()}});
$("#year").textContent=new Date().getFullYear();
renderProducts();updateCart();updateWishlist();setTestimonial(0);
