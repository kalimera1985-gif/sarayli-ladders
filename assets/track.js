/* SARAYLI.KZ — единый трекинг рекламы (Google Ads / GA4 / Meta Pixel).
   Заполните ID ниже после создания кабинетов — больше ничего менять не нужно. */
(function () {
  var CFG = {
    GA4_ID: '',            // напр. 'G-ABC123XYZ'
    ADS_ID: '',            // напр. 'AW-1234567890'
    ADS_LABEL_WHATSAPP: '',// метка конверсии «Клик WhatsApp»
    ADS_LABEL_PHONE: '',   // метка конверсии «Клик телефон»
    ADS_LABEL_LEAD: '',    // метка конверсии «Заявка с сайта»
    META_PIXEL_ID: '',     // напр. '123456789012345'
    YM_ID: 107051685       // Яндекс Метрика sarayli.kz
  };

  window.dataLayer = window.dataLayer || [];
  function gtagShim() { window.dataLayer.push(arguments); }
  if (typeof window.gtag !== 'function') window.gtag = gtagShim;

  function load(src) {
    var s = document.createElement('script'); s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  // Google tag (GA4 + Google Ads)
  var gId = CFG.GA4_ID || CFG.ADS_ID;
  if (gId) {
    load('https://www.googletagmanager.com/gtag/js?id=' + gId);
    gtag('js', new Date());
    if (CFG.GA4_ID) gtag('config', CFG.GA4_ID);
    if (CFG.ADS_ID) gtag('config', CFG.ADS_ID);
  }

  // Meta Pixel
  if (CFG.META_PIXEL_ID && typeof window.fbq !== 'function') {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CFG.META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  // Яндекс Метрика
  if (CFG.YM_ID && typeof window.ym !== 'function') {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    ym(CFG.YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  var sent = {};
  function track(kind, detail) {
    var key = kind + '|' + (detail || '');
    if (sent[key] && Date.now() - sent[key] < 3000) return; // защита от двойного клика
    sent[key] = Date.now();
    var params = { event_category: 'lead', event_label: detail || location.pathname, page_path: location.pathname };
    window.dataLayer.push({ event: kind, lead_detail: detail || '' });
    if (gId) gtag('event', kind, params);
    var label = kind === 'whatsapp_click' ? CFG.ADS_LABEL_WHATSAPP : kind === 'phone_click' ? CFG.ADS_LABEL_PHONE : CFG.ADS_LABEL_LEAD;
    if (CFG.ADS_ID && label) gtag('event', 'conversion', { send_to: CFG.ADS_ID + '/' + label });
    if (CFG.YM_ID && typeof window.ym === 'function') ym(CFG.YM_ID, 'reachGoal', kind);
    if (typeof window.fbq === 'function') fbq('track', kind === 'lead_form' ? 'Lead' : 'Contact', { content_name: kind });
  }
  window.saraylyTrack = track;

  // Клики по ссылкам WhatsApp и телефона
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(h)) track('whatsapp_click', a.textContent.trim().slice(0, 60));
    else if (/^tel:/i.test(h)) track('phone_click', h.replace('tel:', ''));
  }, true);

  // WhatsApp, открытый из корзины через window.open
  var _open = window.open;
  window.open = function (url) {
    try { if (/wa\.me|whatsapp/i.test(String(url))) track('whatsapp_click', 'cart'); } catch (err) {}
    return _open.apply(window, arguments);
  };

  // Заявка засчитывается только после успешной отправки — на странице «Спасибо»
  if (/^\/spasibo\/?$/.test(location.pathname)) track('lead_form', 'spasibo');
})();
