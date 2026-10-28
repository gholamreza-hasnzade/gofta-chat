import { mountGoftaChatWidget, type GoftaChatApi } from './widget'
import './demo.css'

const root = document.querySelector<HTMLDivElement>('#demo-root')!
root.innerHTML = `
  <div class="demo-site" dir="rtl">
    <header class="site-nav"><a class="site-logo" href="#top"><span class="logo-mark">G</span><span>Gofta Chat<small>خانه‌ای برای سلیقهٔ تو</small></span></a><nav><a href="#collection">کالکشن‌ها</a><a href="#story">داستان ما</a><a href="#help">راهنما</a></nav><button class="nav-cta" id="open-chat">گفتگو با ما <span>↖</span></button></header>
    <main>
      <section class="hero" id="top"><div class="hero-copy"><p class="eyebrow"><i></i> دست‌ساز · ماندگار · دوست‌داشتنی</p><h1>برای لحظه‌های<br><em>خوبِ خانه.</em></h1><p class="hero-desc">چیزهایی که هر روز باهاشون زندگی می‌کنی، سزاوار انتخابی بهترن. مجموعه‌ای آرام از سرامیک‌های دست‌ساز و اکسسوری خانه.</p><div class="hero-actions"><a href="#collection" class="shop-button">دیدن مجموعه <span>←</span></a><span class="delivery-note">ارسال رایگان برای سفارش‌های بالای ۲ میلیون</span></div><div class="hero-social"><div class="avatar-stack"><i>س</i><i>م</i><i>ن</i></div><span><b>۴.۹ از ۵</b><small>از تجربهٔ بیش از ۱۲۰۰ مشتری</small></span></div></div><div class="hero-visual"><div class="sun-shape"></div><div class="visual-caption"><span>01 / 04</span><b>مجموعهٔ خاک</b><small>رنگ‌هایی از دل طبیعت</small></div><div class="ceramic-art"><div class="vase vase-large"></div><div class="vase vase-small"></div><div class="art-leaf leaf-one"></div><div class="art-leaf leaf-two"></div><div class="art-table"></div></div><span class="art-stamp">دست‌ساز<br/>در ایران</span></div></section>
      <section class="trust-row"><span>✳︎ طراحی مستقل</span><span>✳︎ ساخت محدود و دست‌ساز</span><span>✳︎ بسته‌بندی سازگار با محیط‌زیست</span></section>
      <section class="collection" id="collection"><div class="section-heading"><div><p class="eyebrow">انتخاب‌های محبوب</p><h2>جزئیات کوچک، حسِ بزرگ.</h2></div><a href="#help">همهٔ محصولات <span>←</span></a></div><div class="product-row"><article class="product"><div class="product-visual product-a"><span>جدید</span><i class="cup-art"></i></div><b>ماگ «صبح آرام»</b><small>سرامیک دست‌ساز · کرم</small><strong>۷۸۰٬۰۰۰ <small>تومان</small></strong></article><article class="product"><div class="product-visual product-b"><span>پرفروش</span><i class="plate-art"></i></div><b>ست بشقاب «خاک»</b><small>لعاب مات · ۲ عدد</small><strong>۱٬۴۵۰٬۰۰۰ <small>تومان</small></strong></article><article class="product"><div class="product-visual product-c"><i class="vase-card-art"></i></div><b>گلدان «باران»</b><small>فرم ارگانیک · سبز زیتونی</small><strong>۱٬۱۲۰٬۰۰۰ <small>تومان</small></strong></article></div></section>
      <section class="embed-card" id="help"><div class="embed-copy"><span class="embed-tag">ویجت پشتیبانی Gofta Chat</span><h2>همین تجربه را<br/>در سایت خودت بساز.</h2><p>یک فایل جاوااسکریپت سبک، مستقل از فریم‌ورک و آمادهٔ نصب با یک تگ. روی دکمهٔ پایین صفحه بزن و ویجت را امتحان کن.</p><div class="feature-pills"><span>Shadow DOM</span><span>RTL و چندرنگ</span><span>بدون وابستگی runtime</span></div></div><div class="code-card"><div class="code-top"><span><i></i><i></i><i></i> نصب سریع</span><button id="copy-code">کپی کد</button></div><pre><code>&lt;script&gt;
  window.GoftaChatConfig = {
    siteId: 'your-site-id',
    brandName: 'فروشگاه من',
    direction: 'rtl',
    primaryColor: '#6558df'
  };
&lt;/script&gt;
&lt;script src="/assets/gofta-chat-widget.js" defer&gt;&lt;/script&gt;</code></pre><small>فایل اسکریپت را بعد از build روی هاست خودت قرار بده.</small></div></section>
    </main>
    <footer class="site-footer"><a class="site-logo" href="#top"><span class="logo-mark">G</span><span>Gofta Chat<small>خانه‌ای برای سلیقهٔ تو</small></span></a><span>این صفحه فقط میزبان نمایشیِ ویجت است؛ گفتگو و اپراتور واقعی متصل نیستند.</span><span>پیش‌نمایش پکیج Gofta Chat · ۱۴۰۵</span></footer>
  </div>
  <aside class="demo-controls" dir="rtl"><b>تنظیم ظاهر ویجت</b><span>رنگ برند</span><div class="swatches"><button class="swatch is-active" data-color="#6558df" aria-label="بنفش" style="--swatch:#6558df"></button><button class="swatch" data-color="#167f72" aria-label="سبز" style="--swatch:#167f72"></button><button class="swatch" data-color="#d67545" aria-label="نارنجی" style="--swatch:#d67545"></button><button class="swatch" data-color="#263c68" aria-label="سرمه‌ای" style="--swatch:#263c68"></button></div><span class="control-hint">برای دیدن ویجت، روی دکمهٔ شناور بزن.</span></aside>
`

let primaryColor = '#6558df'
let api: GoftaChatApi
function renderWidget() {
  api?.destroy()
  api = mountGoftaChatWidget({
    siteId: 'demo-gofta',
    brandName: 'Gofta Chat',
    assistantName: 'دستیار Gofta Chat',
    welcomeMessage: 'سلام! به Gofta Chat خوش اومدی 🌿\nبرای خرید یا سفارش راهنمایی می‌خوای؟',
    primaryColor,
    direction: 'rtl',
    position: 'right',
    persistHistory: true,
  })
  window.GoftaChatWidget = api
}
renderWidget()

root.querySelector('#open-chat')?.addEventListener('click', () => api.open())
root.querySelectorAll<HTMLButtonElement>('.swatch').forEach((button) => button.addEventListener('click', () => {
  primaryColor = button.dataset.color ?? '#6558df'
  root.querySelectorAll('.swatch').forEach((swatch) => swatch.classList.toggle('is-active', swatch === button))
  renderWidget()
}))
root.querySelector('#copy-code')?.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement
  const code = `<script>\n  window.GoftaChatConfig = { siteId: 'your-site-id', brandName: 'فروشگاه من', direction: 'rtl', primaryColor: '${primaryColor}' };\n</script>\n<script src="/assets/gofta-chat-widget.js" defer></script>`
  try {
    await navigator.clipboard.writeText(code)
    button.textContent = 'کپی شد ✓'
    window.setTimeout(() => { button.textContent = 'کپی کد' }, 1600)
  } catch {
    button.textContent = 'کد بالا را انتخاب کن'
  }
})
