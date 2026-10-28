# گفتا — ویجت گفت‌وگوی سبک برای وب

گفتا یک ویجت پشتیبانی قابل‌نصب در هر سایت یا اپ فرانت‌اندی است؛ مستقل از React، Vue، Angular و سایر فریم‌ورک‌ها. نسخهٔ تحویلی شامل اسکریپت embed و یک صفحهٔ پیش‌نمایش است، نه backend یا سرویس AI واقعی. ظاهر ویجت در Shadow DOM ایزوله شده و استایل مؤلفه‌ها با Tailwind CSS 4 ساخته می‌شود.

## اجرا و ساخت

نیازمندی: Node.js 20+ و npm.

```bash
npm install
npm run dev
```

پیش‌نمایش روی `http://localhost:3000` باز می‌شود. بررسی و ساخت پکیج:

```bash
npm run typecheck
npm test
npm run build
```

فایل مستقل نصب: `dist/gofta-chat-widget.js`؛ بدون وابستگی runtime و همراه CSS ویجت. در انتشار این نسخه، gzip حدود ۱۶ کیلوبایت است.

## نصب

پس از اجرای build، فایل `dist/gofta-chat-widget.js` را روی هاست قرار بده:

```html
<script>
  window.GoftaChatConfig = {
    siteId: 'store-123',
    brandName: 'فروشگاه من',
    assistantName: 'دستیار فروشگاه',
    welcomeMessage: 'سلام! چطور می‌تونم کمکت کنم؟',
    primaryColor: '#5b57cf',
    direction: 'rtl',       // یا ltr
    position: 'right',      // یا left
    persistHistory: true,
    maxFileSizeMb: 12,
    maxAttachments: 4,
    maxVoiceSeconds: 90,
    onMessage: async (message, context) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, ...context })
      });
      if (!response.ok) throw new Error('Chat service unavailable');
      return (await response.json()).reply;
    }
  };
</script>
<script src="/assets/gofta-chat-widget.js" defer></script>
```

برای اپ‌های SSR، اسکریپت را فقط سمت مرورگر بارگذاری کن. `nonce` تگ اسکریپت به استایل Shadow DOM نیز منتقل می‌شود. پیکربندی از `window.GoftaChatConfig` یا attributeهایی مانند `data-site-id`، `data-brand-name`، `data-primary-color`، `data-direction` و `data-position` خوانده می‌شود.

## تجربه و قابلیت‌ها

- لانچر شناور دایره‌ای، پنل واکنش‌گرا، رنگ و جایگاه قابل‌تنظیم، RTL/LTR و پشتیبانی از کاهش حرکت.
- ظاهر مکالمه شبیه پیام‌رسان: پیام‌ها به‌شکل حباب در دو سمت چت قرار می‌گیرند؛ عملیات در منوی سه‌نقطه‌ای باز می‌شود. ویرایش/حذف فقط برای پیام خود کاربر است و واکنش یا بازخورد ثبت‌شده روی خود حباب نمایش داده می‌شود.
- پیام پاسخ‌شده در composer و در پیام ارسالی با نقل‌قول و پیوند به پیام اصلی مشخص می‌شود.
- پیشنهادهای FAQ و پاسخ‌های نمایشی؛ نشانگر نوشتن و شمارندهٔ پیام‌های تازه.
- بازخورد مفید/غیرمفید برای پاسخ‌ها، درخواست اپراتور با callback و دانلود متن گفتگو.
- انتخاب و پیش‌نمایش عکس، lightbox، پخش audio، فایل‌های رایج، چند پیوست، drag-and-drop و paste تصویر.
- ضبط پیام صوتی با شمارش زمان، توقف/لغو و پیش‌نمایش محلی.
- تاریخچهٔ متنی و شناسهٔ مهمان در `localStorage`؛ دادهٔ باینریِ رسانه ذخیره نمی‌شود.

پیش‌فرض‌ها: حداکثر ۱۲ مگابایت برای هر فایل، ۴ پیوست و ۹۰ ثانیه برای ویس. برای دسترسی به میکروفن، مرورگر به اجازهٔ کاربر و HTTPS (یا localhost) نیاز دارد. پیش‌نمایش فایل و صدا محلی است؛ بارگذاری واقعی را با `onAttachment` به API امن خودت وصل کن.

## API و callbackها

```js
GoftaChatWidget.open();
GoftaChatWidget.close();
GoftaChatWidget.toggle();
GoftaChatWidget.sendMessage('سلام');
GoftaChatWidget.identify('visitor-42');
GoftaChatWidget.destroy();
```

callbackهای اختیاری روی `GoftaChatConfig`:

- `onMessage(message, context)` — پاسخ backend؛ `context.replyTo` در پاسخ به پیام، شناسه/نقش/متن پیام هدف را دارد.
- `onAttachment(file, context)` — upload فایل از طریق endpoint خودت.
- `onHandoffRequest(context)` — تحویل گفتگو به اپراتور.
- `onFeedback(rating, message)` — ثبت بازخورد `up` یا `down`.

رویدادهای window با پیشوند `gofta:` منتشر می‌شوند: `open`, `close`, `visitor-message`, `assistant-message`, `message-edited`, `message-deleted`, `message-restored`, `message-reaction`, `attachment-selected`, `attachments-uploaded`, `voice-recorded`, `handoff-request`, `feedback` و `identify`.

> برای امنیت، کلید API مدل را داخل مرورگر قرار نده؛ درخواست‌ها را از backend خودت عبور بده. AI و اپراتور در صفحهٔ پیش‌نمایش نمایشی‌اند و تا اتصال callbackها به سرویس، backend واقعی وجود ندارد.

## ساختار پروژه

- `src/embed.ts` — bootstrap اسکریپت مستقل و دریافت config.
- `src/widget.ts` — API عمومی، UI، عملیات پیام، فایل و صوت.
- `src/widget.css` — اجزای Tailwind و استایل اختصاصی Shadow DOM.
- `src/replies.ts` — FAQ و پاسخ‌های نمونه.
- `src/demo.ts`, `src/demo.css` — صفحهٔ آزمایشی میزبان ویجت.
