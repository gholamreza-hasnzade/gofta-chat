import { describe, expect, it } from 'vitest'
import { getDemoReply, sampleFaqs } from './replies'

describe('demo assistant responses', () => {
  it('matches a common support topic and normalizes Persian/Arabic characters', () => {
    expect(getDemoReply('هزینه ارسال چقدره؟', sampleFaqs)).toContain('هزینه و زمان ارسال')
    expect(getDemoReply('چطور سفارش را پیگیری کنم؟', sampleFaqs)).toContain('سفارش‌های من')
  })

  it('identifies preview mode for unknown messages and local-only uploads', () => {
    expect(getDemoReply('یه چیز دیگه بپرسم؟', sampleFaqs)).toContain('حالت پیش‌نمایش')
    expect(getDemoReply('یه فایل فرستادم', sampleFaqs)).toContain('در همین مرورگر پیش‌نمایش')
  })
})
