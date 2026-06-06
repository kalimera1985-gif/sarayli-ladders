/* SARAYLI Корзина — localStorage + WhatsApp checkout
   v1.0 — без бэкенда, работает на статичном сайте (GitHub Pages) */

const SARAYLI_PHONE = "77075061928";
const SARAYLI_PHONE_PRETTY = "+7 707 506 19 28";
const CART_KEY = "sarayli_cart_v1";

function fmtPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₸';
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e) { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

function addToCart(sku, name, price, image, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(i => i.sku === sku);
  if (existing) { existing.qty += qty; }
  else { cart.push({sku, name, price, image, qty}); }
  saveCart(cart);
  // toast
  showToast(name + ' — в корзине');
  // analytics events for ads (Meta + TikTok + GA)
  try { if (typeof fbq === 'function') fbq('track', 'AddToCart', {content_ids:[sku], content_type:'product', value:price, currency:'KZT'}); } catch(e){}
  try { if (typeof ttq === 'object') ttq.track('AddToCart', {content_id:sku, content_type:'product', value:price, currency:'KZT'}); } catch(e){}
  try { if (typeof gtag === 'function') gtag('event','add_to_cart',{currency:'KZT', value:price, items:[{item_id:sku, item_name:name, price:price, quantity:qty}]}); } catch(e){}
}

function removeFromCart(sku) {
  saveCart(getCart().filter(i => i.sku !== sku));
  renderCartPage();
}

function changeQty(sku, delta) {
  const cart = getCart();
  const item = cart.find(i => i.sku === sku);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCartPage();
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  document.querySelectorAll('[data-cart-badge]').forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  });
}

function checkoutViaWhatsApp() {
  const cart = getCart();
  if (cart.length === 0) { alert('Корзина пуста'); return; }
  let msg = "Здравствуйте! Хочу оформить заказ на sarayli.kz:%0A%0A";
  cart.forEach((i,idx) => {
    msg += (idx+1)+". "+encodeURIComponent(i.name)+" — "+i.qty+" шт × "+fmtPrice(i.price).replace(' ','%20')+"%0A";
  });
  msg += "%0A*Итого: "+fmtPrice(cartTotal()).replace(' ','%20')+"*%0A%0AИмя:%20%0AГород:%20%0AСпособ%20оплаты:%20";
  try { if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', {value: cartTotal(), currency:'KZT', num_items: cartCount()}); } catch(e){}
  try { if (typeof ttq === 'object') ttq.track('InitiateCheckout', {value: cartTotal(), currency:'KZT'}); } catch(e){}
  try { if (typeof gtag === 'function') gtag('event','begin_checkout',{currency:'KZT', value: cartTotal()}); } catch(e){}
  window.open("https://wa.me/"+SARAYLI_PHONE+"?text="+msg, "_blank");
}

function buyNowWhatsApp(name, price) {
  const msg = "Здравствуйте! Хочу заказать: "+name+" — "+fmtPrice(price)+". Как оформить?";
  try { if (typeof fbq === 'function') fbq('track', 'Lead', {value: price, currency:'KZT'}); } catch(e){}
  try { if (typeof ttq === 'object') ttq.track('SubmitForm'); } catch(e){}
  window.open("https://wa.me/"+SARAYLI_PHONE+"?text="+encodeURIComponent(msg), "_blank");
}

function showToast(text) {
  let t = document.getElementById('sarayli-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sarayli-toast';
    t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#f97316;color:#000;padding:14px 24px;border-radius:999px;font-weight:700;font-family:Inter,sans-serif;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.4);transition:opacity .3s;font-size:14px";
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.style.opacity = '1';
  clearTimeout(window._sarayliToastTimer);
  window._sarayliToastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

function renderCartPage() {
  const root = document.getElementById('cart-root');
  if (!root) return;
  const cart = getCart();
  if (cart.length === 0) {
    root.innerHTML = '<div class="text-center py-20"><p class="text-2xl mb-6">Корзина пуста</p><a href="/" class="bg-[#f97316] text-black font-bold px-6 py-3 rounded-full inline-block">В каталог</a></div>';
    return;
  }
  let html = '<div class="space-y-4 mb-8">';
  cart.forEach(i => {
    html += `
      <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/5 rounded-2xl p-4">
        <img src="${i.image}" alt="${i.name}" class="w-24 h-24 object-cover rounded-lg" onerror="this.style.display='none'">
        <div class="flex-1 text-center sm:text-left">
          <h3 class="font-bold mb-1">${i.name}</h3>
          <p class="text-white/60 text-sm">${fmtPrice(i.price)} × ${i.qty} = <span class="accent font-bold">${fmtPrice(i.price * i.qty)}</span></p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="changeQty('${i.sku}', -1)" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-xl font-bold">−</button>
          <span class="w-8 text-center font-bold">${i.qty}</span>
          <button onclick="changeQty('${i.sku}', 1)" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-xl font-bold">+</button>
          <button onclick="removeFromCart('${i.sku}')" class="ml-2 text-white/50 hover:text-red-400 text-2xl" title="Удалить">×</button>
        </div>
      </div>`;
  });
  html += '</div>';
  html += `<div class="bg-white/5 rounded-2xl p-6 mb-6">
    <div class="flex justify-between text-xl mb-2"><span class="text-white/70">Товаров:</span><span class="font-bold">${cartCount()}</span></div>
    <div class="flex justify-between text-2xl"><span class="text-white/70">Итого:</span><span class="accent font-bold">${fmtPrice(cartTotal())}</span></div>
  </div>
  <div class="space-y-3">
    <button onclick="checkoutViaWhatsApp()" class="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl text-lg">Оформить через WhatsApp</button>
    <button onclick="document.getElementById('lead-form').scrollIntoView({behavior:'smooth'})" class="w-full bg-[#f97316] text-black font-bold py-4 rounded-2xl text-lg">Оставить заявку</button>
    <a href="tel:+${SARAYLI_PHONE}" class="block text-center w-full border border-white/30 py-4 rounded-2xl font-bold">${SARAYLI_PHONE_PRETTY}</a>
  </div>`;
  root.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartPage();
});
