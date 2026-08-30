const cfg=window.SAFYAM_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s);
const money=n=>new Intl.NumberFormat(cfg.locale||'en-NG',{style:'currency',currency:cfg.currency||'NGN',maximumFractionDigits:0}).format(Number(n)||0).replace('NGN','₦');
let client=null,liveMode=false,products=[],settings={},editingId=null;
const loginPanel=$('#loginPanel'),dashboard=$('#dashboard'),modeBadge=$('#modeBadge'),signOutBtn=$('#signOutBtn');

function normalized(p){return {...p,id:Number(p.id),price:Number(p.price)||0,compareAt:Number(p.compareAt??p.compare_at)||0,stock:Number(p.stock)||0,featured:Number(p.featured)||99,active:p.active!==false,image:p.image||p.image_url||'',imageAlt:p.imageAlt||p.image_alt||'',imageCredit:p.imageCredit||p.image_credit||'',tags:Array.isArray(p.tags)?p.tags:(p.tags||'').split(',').map(x=>x.trim()).filter(Boolean)}}
function dbShape(p){return {name:p.name,slug:p.slug||slugify(p.name),category:p.category,price:Number(p.price)||0,compare_at:Number(p.compareAt)||0,badge:p.badge||'',featured:Number(p.featured)||99,active:Boolean(p.active),stock:Number(p.stock)||0,image_url:p.image||'',image_alt:p.imageAlt||'',image_credit:p.imageCredit||'',description:p.desc||'',tags:p.tags||[]}}
function slugify(s=''){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
function uiShapeFromDb(p){return normalized({...p,desc:p.description||p.desc||''})}
function safe(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function start(){
 liveMode=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase);
 if(liveMode){
   client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
   modeBadge.textContent='LIVE BACKEND';modeBadge.style.borderColor='#31583c';modeBadge.style.color='#8fc99c';
   const {data:{session}}=await client.auth.getSession();
   if(session){await showDashboard()}else{loginPanel.hidden=false;dashboard.hidden=true}
   client.auth.onAuthStateChange(async(_,session)=>{if(session)await showDashboard();else{dashboard.hidden=true;loginPanel.hidden=false}})
 }else{
   modeBadge.textContent='DEMO / LOCAL MODE';$('#statMode').textContent='Local';loginPanel.hidden=true;dashboard.hidden=false;await loadLocal();renderAll();
 }
}
async function showDashboard(){loginPanel.hidden=true;dashboard.hidden=false;signOutBtn.hidden=false;$('#statMode').textContent='Live';await loadLive();renderAll()}
async function loadLive(){
 const [{data:p,error:pe},{data:s,error:se}]=await Promise.all([client.from(cfg.productsTable||'products').select('*').order('featured',{ascending:true}),client.from(cfg.settingsTable||'store_settings').select('*').limit(1).maybeSingle()]);
 if(pe){alert('Could not load products: '+pe.message);return}products=(p||[]).map(uiShapeFromDb);settings=se?{}:(s||{});
}
async function loadLocal(){
 const lp=localStorage.getItem('safyam_admin_products'),ls=localStorage.getItem('safyam_admin_settings');
 if(lp){try{products=JSON.parse(lp).map(normalized)}catch{}}
 if(!products.length){const r=await fetch('data/products.json',{cache:'no-store'});products=(await r.json()).map(normalized)}
 if(ls){try{settings=JSON.parse(ls)}catch{}}
 if(!Object.keys(settings).length){const r=await fetch('data/settings.json',{cache:'no-store'});settings=await r.json()}
}
function renderAll(){renderStats();renderProducts();fillSettings()}
function renderStats(){
 $('#statProducts').textContent=products.length;$('#statActive').textContent=products.filter(p=>p.active).length;$('#statLow').textContent=products.filter(p=>p.active&&p.stock<=3).length;
}
function renderProducts(){
 const q=$('#adminSearch').value.trim().toLowerCase();const rows=products.filter(p=>`${p.name} ${p.category} ${p.badge}`.toLowerCase().includes(q));
 $('#productList').innerHTML=rows.length?rows.map(p=>`<article class="admin-product" data-edit="${p.id}">${p.image?`<img src="${safe(p.image)}" alt="">`:'<div class="placeholder"></div>'}<div><h3>${safe(p.name)}</h3><p><span class="status-dot ${p.active?'':'off'}"></span>${p.active?'Active':'Hidden'} · ${safe(p.category)} · Stock ${p.stock}</p></div><strong>${money(p.price)}</strong></article>`).join(''):'<p>No matching products.</p>';
}
function fillSettings(){const f=$('#settingsForm');['brandName','heroTitle','heroText','announcement','whatsapp','email','instagram'].forEach(k=>{if(f.elements[k])f.elements[k].value=settings[k]||settings[toSnake(k)]||''})}
function toSnake(s){return s.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())}

$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(e.currentTarget);$('#loginStatus').textContent='Signing in…';const {error}=await client.auth.signInWithPassword({email:d.get('email'),password:d.get('password')});$('#loginStatus').textContent=error?error.message:'Signed in.'});
signOutBtn.addEventListener('click',()=>client?.auth.signOut());
$('#adminSearch').addEventListener('input',renderProducts);
$('#productList').addEventListener('click',e=>{const row=e.target.closest('[data-edit]');if(row)openEditor(Number(row.dataset.edit))});
$('#newProductBtn').addEventListener('click',()=>openEditor(null));
$('#editorClose').addEventListener('click',closeEditor);$('#editorBackdrop').addEventListener('click',closeEditor);
function openEditor(id){
 editingId=id;const p=id?products.find(x=>x.id===id):null;const f=$('#productForm');f.reset();f.elements.id.value=p?.id||'';f.elements.name.value=p?.name||'';f.elements.category.value=p?.category||'beads';f.elements.badge.value=p?.badge||'New';f.elements.price.value=p?.price||0;f.elements.stock.value=p?.stock??0;f.elements.image.value=p?.image||'';f.elements.imageAlt.value=p?.imageAlt||'';f.elements.desc.value=p?.desc||'';f.elements.tags.value=(p?.tags||[]).join(', ');f.elements.featured.value=p?.featured||products.length+1;f.elements.active.checked=p?.active!==false;$('#editorTitle').textContent=p?'Edit product':'New product';$('#deleteProductBtn').style.visibility=p?'visible':'hidden';$('#productStatus').textContent='';setPreview(p?.image||'');$('#productEditor').classList.add('open');$('#productEditor').setAttribute('aria-hidden','false');$('#editorBackdrop').hidden=false;document.body.style.overflow='hidden'
}
function closeEditor(){$('#productEditor').classList.remove('open');$('#productEditor').setAttribute('aria-hidden','true');$('#editorBackdrop').hidden=true;document.body.style.overflow=''}
function setPreview(url){$('#imagePreview').innerHTML=url?`<img src="${safe(url)}" alt="Product preview">`:'<span>No image selected</span>'}
$('#productForm').elements.image.addEventListener('input',e=>setPreview(e.target.value));
$('#imageUpload').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(liveMode){
   $('#uploadHelp').textContent='Uploading…';const ext=file.name.split('.').pop()||'jpg';const path=`products/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/,''))}.${ext}`;const {error}=await client.storage.from(cfg.storageBucket||'product-images').upload(path,file,{upsert:false});if(error){$('#uploadHelp').textContent='Upload failed: '+error.message;return}const {data}=client.storage.from(cfg.storageBucket||'product-images').getPublicUrl(path);$('#productForm').elements.image.value=data.publicUrl;setPreview(data.publicUrl);$('#uploadHelp').textContent='Uploaded. Save the product to publish.'
 }else{
   const reader=new FileReader();reader.onload=()=>{$('#productForm').elements.image.value=reader.result;setPreview(reader.result);$('#uploadHelp').textContent='Demo image stored in this browser only.'};reader.readAsDataURL(file)
 }
});
$('#productForm').addEventListener('submit',async e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);const p={id:editingId||Date.now(),name:d.get('name').trim(),slug:slugify(d.get('name')),category:d.get('category'),badge:d.get('badge').trim(),price:Number(d.get('price')),stock:Number(d.get('stock')),image:d.get('image').trim(),imageAlt:d.get('imageAlt').trim(),imageCredit:editingId?products.find(x=>x.id===editingId)?.imageCredit||'':'Safyam Creative Emporium',desc:d.get('desc').trim(),tags:d.get('tags').split(',').map(x=>x.trim()).filter(Boolean),featured:Number(d.get('featured'))||99,active:d.get('active')==='on'};
 $('#productStatus').textContent='Saving…';
 if(liveMode){
   let result;if(editingId)result=await client.from(cfg.productsTable||'products').update(dbShape(p)).eq('id',editingId).select().single();else result=await client.from(cfg.productsTable||'products').insert(dbShape(p)).select().single();if(result.error){$('#productStatus').textContent=result.error.message;return}const saved=uiShapeFromDb(result.data);if(editingId)products=products.map(x=>x.id===editingId?saved:x);else products.push(saved);
 }else{
   if(editingId)products=products.map(x=>x.id===editingId?p:x);else products.push(p);localStorage.setItem('safyam_admin_products',JSON.stringify(products));
 }
 renderStats();renderProducts();$('#productStatus').textContent='Saved successfully.';setTimeout(closeEditor,550)
});
$('#deleteProductBtn').addEventListener('click',async()=>{
 if(!editingId||!confirm('Delete this product? This cannot be undone.'))return;$('#productStatus').textContent='Deleting…';if(liveMode){const {error}=await client.from(cfg.productsTable||'products').delete().eq('id',editingId);if(error){$('#productStatus').textContent=error.message;return}}products=products.filter(x=>x.id!==editingId);if(!liveMode)localStorage.setItem('safyam_admin_products',JSON.stringify(products));renderStats();renderProducts();closeEditor()
});
$('#settingsForm').addEventListener('submit',async e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);const next={...settings,brandName:d.get('brandName'),heroTitle:d.get('heroTitle'),heroText:d.get('heroText'),announcement:d.get('announcement'),whatsapp:d.get('whatsapp'),email:d.get('email'),instagram:d.get('instagram')};$('#settingsStatus').textContent='Saving…';
 if(liveMode){const payload={id:settings.id||1,brand_name:next.brandName,hero_title:next.heroTitle,hero_text:next.heroText,announcement:next.announcement,whatsapp:next.whatsapp,email:next.email,instagram:next.instagram};const {data,error}=await client.from(cfg.settingsTable||'store_settings').upsert(payload).select().single();if(error){$('#settingsStatus').textContent=error.message;return}settings={...next,...data}}
 else{settings=next;localStorage.setItem('safyam_admin_settings',JSON.stringify(settings))}
 $('#settingsStatus').textContent='Store settings saved.'
});
start();
