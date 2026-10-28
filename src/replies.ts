export interface FAQItem {
  question: string
  answer: string
  keywords?: string[]
}

export const sampleFaqs: FAQItem[] = [
  { question: 'چطور سفارش را پیگیری کنم؟', answer: 'از بخش «سفارش‌های من» در حساب کاربری، وضعیت و کد رهگیری را می‌بینی. در این پیش‌نمایش، اطلاعات سفارش به سرویس واقعی وصل نیست.', keywords: ['پیگیری', 'رهگیری', 'سفارش'] },
  { question: 'هزینه و زمان ارسال چقدر است؟', answer: 'هزینه و زمان ارسال به نشانی و روش انتخابی بستگی دارد و قبل از پرداخت نمایش داده می‌شود. این پاسخ در نمونهٔ نمایشی قابل‌ویرایش است.', keywords: ['ارسال', 'هزینه', 'پست', 'زمان'] },
  { question: 'امکان مرجوعی دارم؟', answer: 'بله؛ شرایط مرجوعی باید مطابق سیاست فروشگاه شما تنظیم شود. در این نمونه، این پاسخ صرفاً متن آزمایشی است.', keywords: ['مرجوع', 'بازگشت', 'تعویض'] },
  { question: 'چطور با پشتیبانی صحبت کنم؟', answer: 'در نسخهٔ واقعی می‌توان گفتگو را به اپراتور آنلاین منتقل کرد. این نسخه backend یا اپراتور متصل ندارد، اما دکمهٔ درخواست اپراتور و رویداد اتصال در ویجت آماده است.', keywords: ['اپراتور', 'پشتیبانی', 'انسان', 'کارشناس'] },
]

function normalize(value: string) {
  return value.toLocaleLowerCase('fa-IR').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').trim()
}

export function getDemoReply(message: string, faqs: FAQItem[] = sampleFaqs) {
  const text = normalize(message)
  const matched = faqs.find((faq) => (faq.keywords ?? [faq.question]).some((keyword) => text.includes(normalize(keyword))))
  if (matched) return matched.answer
  if (/(پیوست|فایل|ویس|صوت)/.test(text)) return 'پیوست فقط در همین مرورگر پیش‌نمایش می‌شود و هنوز به سرور آپلود نشده است. برای ارسال واقعی، onAttachment را به endpoint امن خودت وصل کن.'
  return 'ممنون که پیام دادی! من در حالت پیش‌نمایش هستم و هنوز به هوش مصنوعی یا backend وصل نشده‌ام. برای پاسخ واقعی، callback امن onMessage را به API سرور خودت وصل کن.'
}
