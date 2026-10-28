import widgetCss from './widget.css?inline'
import { getDemoReply, sampleFaqs, type FAQItem } from './replies'

export interface ReplyContext {
  siteId: string
  pageUrl: string
  pageTitle: string
  visitorId: string
  replyTo?: { id: string; role: ChatRole; text: string }
}
export type ChatRole = 'visitor' | 'assistant'
export type AttachmentKind = 'image' | 'audio' | 'file'
export interface ChatAttachment {
  id: string
  name: string
  type: string
  size: number
  kind: AttachmentKind
  previewUrl?: string
  durationSeconds?: number
  file?: File
}
export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  createdAt: number
  editedAt?: number
  replyTo?: string
  reaction?: string
  feedback?: 'up' | 'down'
  attachments?: ChatAttachment[]
}
export interface GoftaChatConfig {
  siteId?: string
  brandName?: string
  assistantName?: string
  welcomeMessage?: string
  primaryColor?: string
  styleNonce?: string
  direction?: 'rtl' | 'ltr'
  position?: 'right' | 'left'
  initiallyOpen?: boolean
  persistHistory?: boolean
  maxFileSizeMb?: number
  maxAttachments?: number
  maxVoiceSeconds?: number
  faqs?: FAQItem[]
  onMessage?: (message: string, context: ReplyContext) => string | Promise<string>
  onAttachment?: (file: File, context: ReplyContext) => void | Promise<void>
  onHandoffRequest?: (context: ReplyContext) => void | Promise<void>
  onFeedback?: (rating: 'up' | 'down', message: string) => void
}
export interface GoftaChatApi {
  open(): void
  close(): void
  toggle(): void
  sendMessage(message: string): void
  identify(visitorId: string): void
  destroy(): void
}

type PendingDelete = { message: ChatMessage; index: number }

const icon = {
  bot: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 13h.01M16 13h.01M9 17h6M2 12v3M22 12v3"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.2A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7.5 18-3.7-7.8L2 9.5 21 3Z"/><path d="M9.8 13.2 15 8"/></svg>',
  attach: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 12.5 7.1-7.1a4 4 0 0 1 5.7 5.7l-9.2 9.2a6 6 0 0 1-8.5-8.5l9-9"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  reply: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 17-5-5 5-5M4 12h9a7 7 0 0 1 7 7"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}
function newId(prefix = 'm') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}` }
function safeColor(value: string) { return CSS.supports('color', value) ? value : '#5b57cf' }
function timeText(time: number) { return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(time) }
function durationText(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}` }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }
function getAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'file'
}
function supportedFile(file: File) { return file.type.startsWith('image/') || file.type.startsWith('audio/') || /\.(pdf|txt|doc|docx|xls|xlsx|csv)$/i.test(file.name) }
function loadHistory(key: string): ChatMessage[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((item): item is ChatMessage => Boolean(item && typeof item.text === 'string' && (item.role === 'visitor' || item.role === 'assistant'))).slice(-80).map((item, index) => ({
      ...item,
      id: typeof item.id === 'string' ? item.id : `old-${item.createdAt ?? index}-${index}`,
      createdAt: Number(item.createdAt) || Date.now(),
      attachments: Array.isArray(item.attachments) ? item.attachments.map((file) => ({ ...file, file: undefined, previewUrl: undefined })) : [],
    }))
  } catch { return [] }
}

export function mountChatWidget(options: GoftaChatConfig = {}): GoftaChatApi {
  const config = {
    siteId: 'demo-site-v2', brandName: 'گفتا', assistantName: 'دستیار گفتا',
    welcomeMessage: 'سلام! خوش اومدی 🌿\nپیامت را بنویس یا از گزینه‌های زیر شروع کن.',
    primaryColor: '#5b57cf', direction: 'rtl' as const, position: 'right' as const,
    initiallyOpen: false, persistHistory: true, maxFileSizeMb: 12, maxAttachments: 4, maxVoiceSeconds: 90,
    ...options,
  }
  config.maxFileSizeMb = Math.max(1, Math.min(50, Number(config.maxFileSizeMb) || 12))
  config.maxAttachments = Math.max(1, Math.min(8, Math.floor(Number(config.maxAttachments) || 4)))
  config.maxVoiceSeconds = Math.max(5, Math.min(180, Math.floor(Number(config.maxVoiceSeconds) || 90)))
  const existing = document.querySelector<HTMLElement>('[data-gofta-chat-root="true"]')
  if (existing?.shadowRoot) return window.GoftaChatWidget ?? { open() {}, close() {}, toggle() {}, sendMessage() {}, identify() {}, destroy() {} }

  const host = document.createElement('div')
  host.dataset.goftaChatRoot = 'true'
  const shadow = host.attachShadow({ mode: 'open' })
  const styles = document.createElement('style')
  if (config.styleNonce) styles.nonce = config.styleNonce
  styles.textContent = `${widgetCss}\n.gft-root{--gft-brand:${safeColor(config.primaryColor)}}`
  const esc = escapeHtml
  const faqs = config.faqs?.length ? config.faqs : sampleFaqs
  const siteKey = `gofta:v2:${config.siteId}`
  const visitorKey = `${siteKey}:visitor`
  let visitorId = ''
  try { visitorId = localStorage.getItem(visitorKey) || newId('guest'); localStorage.setItem(visitorKey, visitorId) }
  catch { visitorId = newId('guest') }

  shadow.innerHTML = `<div class="gft-root gft-${config.position === 'left' ? 'left' : 'right'}" dir="${config.direction === 'ltr' ? 'ltr' : 'rtl'}">
    <section class="gft-panel" role="dialog" aria-label="گفت‌وگو با ${esc(config.brandName)}" aria-modal="false" hidden>
      <header class="gft-header">
        <span class="gft-brand-avatar">${icon.bot}</span>
        <div class="gft-brand-copy"><strong>${esc(config.brandName)}</strong><span><i></i> پیش‌نمایش · AI به backend نیاز دارد</span></div>
        <button class="gft-header-action" data-action="clear" type="button">گفتگوی تازه</button>
        <button class="gft-close" data-action="close" type="button" aria-label="بستن گفتگو">${icon.close}</button>
      </header>
      <main class="gft-scroll" aria-live="polite">
        <div class="gft-welcome"><span class="gft-welcome-icon">✦</span><div><b>${esc(config.assistantName)}</b><p>${esc(config.welcomeMessage).replace(/\n/g, '<br>')}</p><small>برای شروع، یکی از این‌ها را بپرس</small></div></div>
        <div class="gft-quick-replies">${faqs.slice(0, 3).map((faq, index) => `<button type="button" data-action="quick" data-index="${index}">${esc(faq.question)} <span>←</span></button>`).join('')}</div>
        <div class="gft-thread" aria-label="پیام‌ها"></div>
        <div class="gft-typing" hidden><i></i><i></i><i></i><span>${esc(config.assistantName)} در حال نوشتن است</span></div>
        <div class="gft-undo" hidden><span>پیام حذف شد.</span><button data-action="undo" type="button">بازگردانی</button></div>
      </main>
      <footer class="gft-footer">
        <div class="gft-reply-context" hidden><div><small>در پاسخ به</small><b></b></div><button data-action="cancel-reply" type="button" aria-label="لغو پاسخ">×</button></div>
        <div class="gft-attachments" hidden></div>
        <div class="gft-recording" hidden><span class="gft-record-dot"></span><time>۰۰:۰۰</time><b>در حال ضبط</b><button data-action="stop-recording" type="button">پایان و پیش‌نمایش</button><button data-action="cancel-recording" type="button">لغو</button></div>
        <div class="gft-notice" role="status" aria-live="polite" hidden></div>
        <div class="gft-emoji-popover" hidden><button type="button" data-emoji="😊">😊</button><button type="button" data-emoji="👍">👍</button><button type="button" data-emoji="❤️">❤️</button><button type="button" data-emoji="🙏">🙏</button><button type="button" data-emoji="✨">✨</button></div>
        <div class="gft-composer">
          <button class="gft-tool" data-action="attach" type="button" aria-label="پیوست فایل">${icon.attach}</button>
          <button class="gft-tool" data-action="emoji" type="button" aria-label="شکلک">☺</button>
          <button class="gft-tool gft-mic" data-action="record" type="button" aria-label="ضبط ویس">${icon.mic}</button>
          <textarea rows="1" maxlength="1200" aria-label="پیام شما" placeholder="پیامت را بنویس… با Enter بفرست"></textarea>
          <button class="gft-send" data-action="send" type="button" disabled>${icon.send}<span>ارسال</span></button>
          <input class="gft-file-input" type="file" accept="image/*,audio/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.csv" multiple hidden />
        </div>
        <div class="gft-footnote"><span>نسخهٔ آزمایشی · پاسخ واقعی با backend</span><div><button type="button" data-action="handoff">اپراتور انسانی</button><button type="button" data-action="export">دانلود گفتگو</button></div></div>
      </footer>
    </section>
    <button class="gft-launcher" data-action="toggle" type="button" aria-label="باز کردن گفتگو" aria-expanded="false">${icon.chat}<span class="gft-launcher-label">گفتگو با ما</span><i class="gft-unread" hidden>۱</i></button>
    <div class="gft-lightbox" hidden role="dialog" aria-modal="true" aria-label="پیش‌نمایش عکس"><button type="button" data-action="close-image" aria-label="بستن">${icon.close}</button><img alt="پیش‌نمایش پیوست" /></div>
  </div>`
  shadow.prepend(styles)
  document.body.append(host)

  const panel = shadow.querySelector<HTMLElement>('.gft-panel')!
  const launcher = shadow.querySelector<HTMLButtonElement>('.gft-launcher')!
  const thread = shadow.querySelector<HTMLElement>('.gft-thread')!
  const scroll = shadow.querySelector<HTMLElement>('.gft-scroll')!
  const input = shadow.querySelector<HTMLTextAreaElement>('.gft-composer textarea')!
  const sendButton = shadow.querySelector<HTMLButtonElement>('.gft-send')!
  const typing = shadow.querySelector<HTMLElement>('.gft-typing')!
  const undoBar = shadow.querySelector<HTMLElement>('.gft-undo')!
  const replyContextEl = shadow.querySelector<HTMLElement>('.gft-reply-context')!
  const replyContextText = replyContextEl.querySelector('b')!
  const attachmentQueue = shadow.querySelector<HTMLElement>('.gft-attachments')!
  const fileInput = shadow.querySelector<HTMLInputElement>('.gft-file-input')!
  const notice = shadow.querySelector<HTMLElement>('.gft-notice')!
  const emojiPopover = shadow.querySelector<HTMLElement>('.gft-emoji-popover')!
  const recordingBar = shadow.querySelector<HTMLElement>('.gft-recording')!
  const lightbox = shadow.querySelector<HTMLElement>('.gft-lightbox')!
  const lightboxImage = lightbox.querySelector<HTMLImageElement>('img')!
  const storage = config.persistHistory ? loadHistory(siteKey) : []
  let messages = storage
  let attachments: ChatAttachment[] = []
  let replyToId: string | null = null
  let editingId: string | null = null
  let pendingDelete: PendingDelete | null = null
  let deleteTimer = 0
  let clearArmTimer = 0
  let clearArmed = false
  let noticeTimer = 0
  let recordingTimer = 0
  let recordingStarted = 0
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let recordingChunks: Blob[] = []
  let discardRecording = false
  let pendingReplies = 0
  let conversationEpoch = 0
  let unreadCount = 0
  let destroyed = false
  const objectUrls = new Set<string>()

  const emit = (name: string, detail: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent(`gofta:${name}`, { detail: { siteId: config.siteId, ...detail } }))
  const save = () => {
    if (!config.persistHistory) return
    try {
      localStorage.setItem(siteKey, JSON.stringify(messages.slice(-80).map((message) => ({ ...message, attachments: message.attachments?.map(({ id, name, type, size, kind, durationSeconds }) => ({ id, name, type, size, kind, durationSeconds })) }))))
    } catch { /* storage may be disabled/full */ }
  }
  const showNotice = (text: string) => {
    notice.textContent = text
    notice.hidden = false
    window.clearTimeout(noticeTimer)
    noticeTimer = window.setTimeout(() => { notice.hidden = true }, 3600)
  }
  const close = () => { panel.hidden = true; launcher.classList.remove('is-open'); launcher.setAttribute('aria-label', 'باز کردن گفتگو'); launcher.setAttribute('aria-expanded', 'false'); launcher.innerHTML = `${icon.chat}<span class="gft-launcher-label">گفتگو با ما</span><i class="gft-unread" hidden>۱</i>`; emit('close') }
  const open = () => { panel.hidden = false; launcher.classList.add('is-open'); launcher.setAttribute('aria-label', 'بستن گفتگو'); launcher.setAttribute('aria-expanded', 'true'); launcher.innerHTML = `${icon.close}<span class="gft-launcher-label">گفتگو با ما</span><i class="gft-unread" hidden>۱</i>`; unreadCount = 0; window.setTimeout(() => input.focus(), 40); emit('open') }
  const toggle = () => panel.hidden ? open() : close()
  const scrollToBottom = () => { scroll.scrollTop = scroll.scrollHeight }
  const getMessage = (id?: string) => id ? messages.find((message) => message.id === id) : undefined
  const makeMessage = (role: ChatRole, text: string, files: ChatAttachment[] = [], replyTo?: string): ChatMessage => ({ id: newId(), role, text, createdAt: Date.now(), ...(files.length ? { attachments: files } : {}), ...(replyTo ? { replyTo } : {}) })

  function revokeAttachment(file: ChatAttachment) {
    if (file.previewUrl) { URL.revokeObjectURL(file.previewUrl); objectUrls.delete(file.previewUrl) }
  }
  function addMessage(message: ChatMessage) {
    messages.push(message)
    if (messages.length > 80) messages.splice(0, messages.length - 80)
    save()
    renderMessages(true)
  }
  function renderFilePreview(file: ChatAttachment, compact = false): HTMLElement {
    const card = document.createElement('div')
    card.className = `gft-file-card ${compact ? 'is-compact' : ''}`
    if (file.kind === 'image' && file.previewUrl) {
      const button = document.createElement('button')
      button.className = 'gft-image-preview'
      button.type = 'button'
      button.dataset.action = 'preview-image'
      button.dataset.url = file.previewUrl
      button.dataset.alt = file.name
      const img = document.createElement('img')
      img.src = file.previewUrl
      img.alt = file.name
      img.loading = 'lazy'
      button.append(img)
      card.append(button)
    } else if (file.kind === 'audio' && file.previewUrl) {
      const audio = document.createElement('audio')
      audio.controls = true
      audio.preload = 'metadata'
      audio.src = file.previewUrl
      card.append(audio)
    } else {
      const badge = document.createElement('span')
      badge.innerHTML = file.kind === 'image' ? icon.image : file.kind === 'audio' ? icon.mic : icon.file
      card.append(badge)
    }
    const details = document.createElement('span')
    details.className = 'gft-file-meta'
    const name = document.createElement('b')
    name.textContent = file.kind === 'audio' ? `ویس ${file.durationSeconds ? `· ${durationText(file.durationSeconds)}` : ''}` : file.name
    const size = document.createElement('small')
    size.textContent = formatBytes(file.size)
    details.append(name, size)
    card.append(details)
    if (compact) {
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'gft-remove-file'
      remove.textContent = '×'
      remove.setAttribute('aria-label', `حذف ${file.name}`)
      remove.dataset.action = 'remove-file'
      remove.dataset.id = file.id
      card.append(remove)
    }
    return card
  }
  function renderQueue() {
    attachmentQueue.replaceChildren(...attachments.map((file) => renderFilePreview(file, true)))
    attachmentQueue.hidden = attachments.length === 0
    updateSendState()
  }
  function updateSendState() { sendButton.disabled = !input.value.trim() && attachments.length === 0 }
  function hideReply() {
    replyToId = null
    replyContextEl.hidden = true
    replyContextText.textContent = ''
    replyContextText.removeAttribute('title')
  }
  function flashMessage(id: string) {
    const row = Array.from(thread.querySelectorAll<HTMLElement>('.gft-message')).find((element) => element.dataset.messageId === id)
    if (!row) return
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    row.classList.add('is-highlighted')
    window.setTimeout(() => row.classList.remove('is-highlighted'), 1200)
  }
  function undoDelete() {
    if (!pendingDelete) return
    window.clearTimeout(deleteTimer)
    const restored = pendingDelete.message
    messages.splice(Math.min(pendingDelete.index, messages.length), 0, restored)
    pendingDelete = null
    undoBar.hidden = true
    save()
    renderMessages()
    showNotice('پیام بازیابی شد.')
    emit('message-restored', { messageId: restored.id })
  }
  function deleteMessage(id: string) {
    const index = messages.findIndex((item) => item.id === id)
    if (index < 0 || messages[index].role !== 'visitor') return
    if (pendingDelete) { pendingDelete.message.attachments?.forEach(revokeAttachment); pendingDelete = null }
    const [message] = messages.splice(index, 1)
    pendingDelete = { message, index }
    if (replyToId === id) hideReply()
    save()
    renderMessages()
    undoBar.hidden = false
    window.clearTimeout(deleteTimer)
    deleteTimer = window.setTimeout(() => {
      pendingDelete?.message.attachments?.forEach(revokeAttachment)
      pendingDelete = null
      undoBar.hidden = true
    }, 7000)
    undoBar.hidden = false
    showNotice('پیام حذف شد؛ تا چند ثانیه می‌توانی برش گردانی.')
    emit('message-deleted', { messageId: id })
  }
  function editMessage(id: string) {
    const message = getMessage(id)
    const textarea = shadow.querySelector<HTMLTextAreaElement>('[data-edit-text]')
    if (!message || message.role !== 'visitor' || !textarea) return
    const text = textarea.value.trim()
    if (!text) { textarea.focus(); return }
    message.text = text
    message.editedAt = Date.now()
    editingId = null
    save()
    renderMessages()
    showNotice('پیام ویرایش شد.')
    emit('message-edited', { messageId: id, text })
  }
  async function copyMessage(id: string) {
    const message = getMessage(id)
    if (!message?.text) return
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(message.text)
      else {
        const temp = document.createElement('textarea')
        temp.value = message.text
        temp.style.position = 'fixed'
        temp.style.opacity = '0'
        document.body.append(temp)
        temp.select()
        const ok = document.execCommand('copy')
        temp.remove()
        if (!ok) throw new Error('copy unavailable')
      }
      showNotice('متن پیام کپی شد.')
    } catch { showNotice('کپی در این مرورگر مجاز نیست.') }
  }
  function exportTranscript() {
    const lines = messages.map((message) => {
      const name = message.role === 'visitor' ? 'شما' : config.assistantName
      const reply = message.replyTo ? `\n↳ در پاسخ به: ${getMessage(message.replyTo)?.text || 'پیام حذف‌شده'}` : ''
      const files = message.attachments?.length ? `\nپیوست: ${message.attachments.map((file) => file.name).join('، ')}` : ''
      return `[${new Date(message.createdAt).toLocaleString('fa-IR')}] ${name}: ${message.text}${reply}${files}`
    }).join('\n\n')
    const blob = new Blob([lines || 'گفتگو هنوز پیامی ندارد.'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gofta-chat-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    showNotice('متن گفتگو دانلود شد.')
  }
  async function handoff() {
    try {
      const replyContext: ReplyContext = { siteId: config.siteId, pageUrl: location.href, pageTitle: document.title, visitorId }
      await config.onHandoffRequest?.(replyContext)
      emit('handoff-request', { visitorId })
      showNotice(config.onHandoffRequest ? 'درخواستت برای اپراتور فرستاده شد.' : 'در نسخهٔ نمایشی اپراتور وصل نیست؛ با onHandoffRequest به سرویس خودت وصلش کن.')
    } catch { showNotice('درخواست اپراتور ارسال نشد؛ کمی بعد دوباره تلاش کن.') }
  }
  async function askAssistant(text: string, quoted?: ChatMessage, epoch = conversationEpoch) {
    pendingReplies += 1
    typing.hidden = false
    try {
      const replyContext: ReplyContext = { siteId: config.siteId, pageUrl: location.href, pageTitle: document.title, visitorId, ...(quoted ? { replyTo: { id: quoted.id, role: quoted.role, text: quoted.text } } : {}) }
      const result = config.onMessage ? await config.onMessage(text, replyContext) : await new Promise<string>((resolve) => window.setTimeout(() => resolve(getDemoReply(text, faqs)), 450 + Math.min(text.length * 6, 800)))
      if (destroyed || epoch !== conversationEpoch) return
      const reply = typeof result === 'string' && result.trim() ? result.trim() : 'پاسخی دریافت نشد؛ لطفاً دوباره تلاش کن.'
      const message = makeMessage('assistant', reply)
      addMessage(message)
      emit('assistant-message', { messageId: message.id, text: reply })
      if (panel.hidden) { unreadCount += 1; const badge = shadow.querySelector<HTMLElement>('.gft-unread')!; badge.textContent = unreadCount > 9 ? '۹+' : String(unreadCount); badge.hidden = false }
    } catch (error) {
      if (destroyed || epoch !== conversationEpoch) return
      addMessage(makeMessage('assistant', 'ارتباط با سرویس پاسخ‌گویی برقرار نشد. کمی بعد دوباره تلاش کن.'))
      console.error('[Gofta] message callback failed', error)
    } finally {
      pendingReplies = Math.max(0, pendingReplies - 1)
      typing.hidden = pendingReplies === 0
    }
  }
  async function sendMessage(textValue = input.value) {
    const text = textValue.trim()
    if ((!text && !attachments.length) || destroyed) return
    const epoch = conversationEpoch
    const files = [...attachments]
    const target = getMessage(replyToId ?? undefined)
    attachments = []
    fileInput.value = ''
    renderQueue()
    input.value = ''
    input.style.height = 'auto'
    hideReply()
    emojiPopover.hidden = true
    const userMessage = makeMessage('visitor', text, files, target?.id)
    addMessage(userMessage)
    emit('visitor-message', { messageId: userMessage.id, text, replyTo: target?.id, attachments: files.map(({ name, type, size, kind }) => ({ name, type, size, kind })) })
    let canAsk = true
    if (config.onAttachment) {
      try {
        await Promise.all(files.filter((file) => file.file).map((file) => config.onAttachment!(file.file!, { siteId: config.siteId, pageUrl: location.href, pageTitle: document.title, visitorId })))
        if (files.length) emit('attachments-uploaded', { messageId: userMessage.id, count: files.length })
      } catch { canAsk = false; showNotice('ارسال پیوست ناموفق بود؛ پیام متنی ثبت شد.') }
    }
    const prompt = text || (files.length ? 'کاربر یک فایل رسانه‌ای فرستاد.' : '')
    if (canAsk && epoch === conversationEpoch && !destroyed) await askAssistant(prompt, target, epoch)
  }
  function clearConversation() {
    const button = shadow.querySelector<HTMLButtonElement>('[data-action="clear"]')!
    if (!clearArmed) {
      clearArmed = true
      button.textContent = 'تأیید پاک‌کردن؟'
      showNotice('برای جلوگیری از حذف ناخواسته، یک‌بار دیگر بزن.')
      window.clearTimeout(clearArmTimer)
      clearArmTimer = window.setTimeout(() => { clearArmed = false; button.textContent = 'گفتگوی تازه' }, 3500)
      return
    }
    clearArmed = false
    window.clearTimeout(clearArmTimer)
    button.textContent = 'گفتگوی تازه'
    conversationEpoch += 1
    pendingReplies = 0
    typing.hidden = true
    window.clearTimeout(deleteTimer)
    messages.forEach((message) => message.attachments?.forEach(revokeAttachment))
    pendingDelete?.message.attachments?.forEach(revokeAttachment)
    attachments.forEach((file) => { if (file.previewUrl) { URL.revokeObjectURL(file.previewUrl); objectUrls.delete(file.previewUrl) } })
    attachments = []
    pendingDelete = null
    messages = []
    editingId = null
    fileInput.value = ''
    renderQueue()
    hideReply()
    save()
    renderMessages(true)
    undoBar.hidden = true
    showNotice('گفتگو پاک شد.')
  }
  function addFiles(files: File[]) {
    let added = 0
    for (const file of files) {
      if (attachments.length >= config.maxAttachments) { showNotice(`حداکثر ${config.maxAttachments} پیوست مجاز است.`); break }
      if (!supportedFile(file)) { showNotice(`نوع «${file.name}» پشتیبانی نمی‌شود.`); continue }
      if (file.size > config.maxFileSizeMb * 1024 * 1024) { showNotice(`حجم فایل از ${config.maxFileSizeMb} مگابایت بیشتر است.`); continue }
      const kind = getAttachmentKind(file)
      const previewUrl = kind === 'file' ? undefined : URL.createObjectURL(file)
      if (previewUrl) objectUrls.add(previewUrl)
      attachments.push({ id: newId('a'), name: file.name, type: file.type, size: file.size, kind, ...(previewUrl ? { previewUrl } : {}), file })
      added += 1
    }
    if (added) { renderQueue(); showNotice(`${added} فایل اضافه شد؛ برای ارسال واقعی به backend نیاز است.`); emit('attachment-selected', { count: added, names: attachments.map((file) => file.name) }) }
  }
  function setImagePreview(src: string, alt: string) {
    lightboxImage.src = src
    lightboxImage.alt = alt
    lightbox.hidden = false
  }
  function stopRecording(discard: boolean) {
    if (!recorder || recorder.state !== 'recording') return
    discardRecording = discard
    window.clearInterval(recordingTimer)
    recordingBar.hidden = true
    recorder.stop()
  }
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) { showNotice('ضبط ویس به میکروفن و HTTPS نیاز دارد.'); return }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (destroyed) { stream.getTracks().forEach((track) => track.stop()); return }
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recordingChunks = []
      discardRecording = false
      recordingStarted = Date.now()
      recorder.addEventListener('dataavailable', (event) => { if (event.data.size) recordingChunks.push(event.data) })
      recorder.addEventListener('stop', () => {
        stream?.getTracks().forEach((track) => track.stop())
        stream = null
        if (!discardRecording && recordingChunks.length) {
          const blob = new Blob(recordingChunks, { type: recorder?.mimeType || 'audio/webm' })
          const file = new File([blob], `gofta-voice-${Date.now()}.webm`, { type: blob.type })
          const duration = (Date.now() - recordingStarted) / 1000
          if (file.size <= config.maxFileSizeMb * 1024 * 1024) {
            const url = URL.createObjectURL(file)
            objectUrls.add(url)
            attachments.push({ id: newId('voice'), name: file.name, type: file.type, size: file.size, kind: 'audio', previewUrl: url, durationSeconds: duration, file })
            renderQueue()
            showNotice('ویس آماده است؛ پخش و بعد ارسالش کن.')
            emit('voice-recorded', { durationSeconds: Math.round(duration), size: file.size })
          } else showNotice('حجم ویس از محدودیت بیشتر شد.')
        }
        recordingChunks = []
      }, { once: true })
      recorder.start(200)
      recordingBar.hidden = false
      recordingStarted = Date.now()
      recordingTimer = window.setInterval(() => {
        const seconds = (Date.now() - recordingStarted) / 1000
        recordingBar.querySelector('time')!.textContent = durationText(seconds)
        if (seconds >= config.maxVoiceSeconds) { showNotice('به سقف زمان ضبط رسیدی؛ ویس برای پیش‌نمایش آماده شد.'); stopRecording(false) }
      }, 250)
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
      showNotice('میکروفن در دسترس نیست یا اجازه داده نشد.')
      console.info('[Gofta] recording unavailable', error)
    }
  }

  function renderMessages(forceBottom = false) {
    const wasNearBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 64
    thread.replaceChildren(...messages.map(messageElement))
    undoBar.hidden = !pendingDelete
    if (forceBottom || wasNearBottom) scrollToBottom()
  }
  function messageElement(message: ChatMessage): HTMLElement {
    const row = document.createElement('article')
    row.className = `gft-message ${message.role === 'visitor' ? 'from-visitor' : 'from-assistant'}${editingId === message.id ? ' is-editing' : ''}`
    row.dataset.messageId = message.id
    const body = document.createElement('div')
    body.className = 'gft-message-body'
    const content = document.createElement('div')
    content.className = 'gft-message-content'
    if (message.replyTo) {
      const target = messages.find((item) => item.id === message.replyTo)
      const quote = document.createElement('button')
      quote.type = 'button'
      quote.className = 'gft-quote'
      quote.dataset.action = 'jump-to-message'
      quote.dataset.id = message.replyTo
      const label = document.createElement('small')
      label.textContent = `پاسخ به ${target?.role === 'visitor' ? 'شما' : config.assistantName}`
      const text = document.createElement('span')
      text.textContent = target?.text || 'پیام اصلی حذف شده است'
      quote.append(label, text)
      content.append(quote)
    }
    if (editingId === message.id) {
      const edit = document.createElement('div')
      edit.className = 'gft-edit-box'
      edit.innerHTML = '<label>در حال ویرایش پیام</label><textarea data-edit-text maxlength="1200"></textarea><div><button type="button" data-action="cancel-edit">لغو</button><button type="button" class="primary" data-action="save-edit" data-id="">ذخیرهٔ تغییر</button></div>'
      edit.querySelector<HTMLTextAreaElement>('textarea')!.value = message.text
      edit.querySelector<HTMLButtonElement>('[data-action="save-edit"]')!.dataset.id = message.id
      content.append(edit)
    } else if (message.text) {
      const bubbleWrap = document.createElement('div')
      bubbleWrap.className = 'gft-bubble-wrap'
      const bubble = document.createElement('div')
      bubble.className = 'gft-bubble'
      bubble.textContent = message.text
      bubbleWrap.append(bubble)
      content.append(bubbleWrap)
    }
    message.attachments?.forEach((attachment) => content.append(renderFilePreview(attachment)))
    const badges = document.createElement('div')
    badges.className = 'gft-reaction-badges'
    if (message.reaction) {
      const reaction = document.createElement('button')
      reaction.type = 'button'
      reaction.className = 'gft-reaction-badge'
      reaction.dataset.action = 'react'
      reaction.dataset.id = message.id
      reaction.dataset.reaction = message.reaction
      reaction.textContent = message.reaction
      reaction.title = 'برای برداشتن واکنش کلیک کن'
      badges.append(reaction)
    }
    if (message.feedback) {
      const feedbackBadge = document.createElement('span')
      feedbackBadge.className = 'gft-reaction-badge gft-feedback-badge'
      feedbackBadge.textContent = message.feedback === 'up' ? '👍' : '👎'
      feedbackBadge.title = message.feedback === 'up' ? 'بازخورد مثبت شما' : 'بازخورد منفی شما'
      badges.append(feedbackBadge)
    }
    if (badges.childElementCount) { content.classList.add('has-reactions'); content.append(badges) }
    body.append(content)
    const meta = document.createElement('div')
    meta.className = 'gft-message-meta'
    meta.textContent = `${timeText(message.createdAt)}${message.editedAt ? ' · ویرایش‌شده' : ''}`
    const metaRow = document.createElement('div')
    metaRow.className = 'gft-message-meta-row'
    metaRow.append(meta)
    const menuToggle = document.createElement('button')
    menuToggle.type = 'button'
    menuToggle.className = 'gft-message-more'
    menuToggle.dataset.action = 'message-menu'
    menuToggle.setAttribute('aria-label', 'نمایش عملیات پیام')
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.textContent = '⋯'
    metaRow.append(menuToggle)
    body.append(metaRow)
    row.append(body)
    const toolbar = document.createElement('div')
    toolbar.className = 'gft-toolbar'
    toolbar.setAttribute('role', 'group')
    toolbar.setAttribute('aria-label', `عملیات پیام ${message.role === 'visitor' ? 'شما' : config.assistantName}`)
    toolbar.hidden = true
    const control = (action: string, text: string, id = message.id, selected = false, reaction?: string) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.action = action
      button.dataset.id = id
      if (reaction) button.dataset.reaction = reaction
      button.textContent = text
      if (selected) button.classList.add('selected')
      toolbar.append(button)
    }
    control('reply', '↩ پاسخ')
    if (message.text) control('copy', 'کپی')
    if (message.role === 'visitor' && message.text) {
      control('edit', 'ویرایش')
      control('delete', 'حذف')
    }
    for (const emoji of ['👍', '❤️', '😂']) control('react', emoji, message.id, message.reaction === emoji, emoji)
    if (message.role === 'assistant' && message.text) {
      const feedback = document.createElement('div')
      feedback.className = 'gft-feedback'
      const prompt = document.createElement('span')
      prompt.textContent = 'پاسخ مفید بود؟'
      feedback.append(prompt)
      for (const [rating, label] of [['up', 'بله'], ['down', 'نه']] as const) {
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.action = 'feedback'
        button.dataset.id = message.id
        button.dataset.rating = rating
        button.textContent = label
        button.setAttribute('aria-pressed', String(message.feedback === rating))
        if (message.feedback === rating) button.classList.add('selected')
        feedback.append(button)
      }
      toolbar.append(feedback)
    }
    body.append(toolbar)
    return row
  }

  function onClick(event: Event) {
    const target = event.target
    if (!(target instanceof Element)) return
    const closeMessageMenus = () => {
      thread.querySelectorAll<HTMLElement>('.gft-toolbar').forEach((menu) => { menu.hidden = true })
      thread.querySelectorAll<HTMLButtonElement>('.gft-message-more').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'))
    }
    const button = target.closest<HTMLButtonElement>('button[data-action]')
    if (!button) { closeMessageMenus(); return }
    const action = button.dataset.action
    const id = button.dataset.id ?? ''
    if (action === 'message-menu') {
      const row = button.closest<HTMLElement>('.gft-message')
      const toolbar = row?.querySelector<HTMLElement>('.gft-toolbar')
      if (!row || !toolbar) return
      const shouldOpen = toolbar.hidden
      closeMessageMenus()
      toolbar.hidden = !shouldOpen
      button.setAttribute('aria-expanded', String(shouldOpen))
      return
    }
    closeMessageMenus()
    if (action === 'toggle') toggle()
    else if (action === 'close') close()
    else if (action === 'send') void sendMessage()
    else if (action === 'clear') clearConversation()
    else if (action === 'reply') {
      const message = messages.find((item) => item.id === id)
      if (message) { const quotedText = `${message.role === 'visitor' ? 'پیام شما' : config.assistantName}: ${message.text || 'پیوست'}`; replyToId = id; replyContextText.textContent = quotedText; replyContextText.title = quotedText; replyContextEl.hidden = false; input.focus() }
    } else if (action === 'cancel-reply') hideReply()
    else if (action === 'edit') { editingId = id; renderMessages(); shadow.querySelector<HTMLTextAreaElement>('[data-edit-text]')?.focus() }
    else if (action === 'save-edit') editMessage(id)
    else if (action === 'cancel-edit') { editingId = null; renderMessages() }
    else if (action === 'delete') deleteMessage(id)
    else if (action === 'undo') undoDelete()
    else if (action === 'copy') void copyMessage(id)
    else if (action === 'export') exportTranscript()
    else if (action === 'handoff') void handoff()
    else if (action === 'feedback') {
      const message = getMessage(id)
      const rating = button.dataset.rating === 'down' ? 'down' : 'up'
      if (message) {
        message.feedback = rating
        save()
        renderMessages()
        showNotice(rating === 'up' ? 'ممنون از بازخوردت!' : 'ممنون؛ این بازخورد برای بهترشدن پاسخ‌ها ثبت شد.')
        try { config.onFeedback?.(rating, message.text) } catch { /* callbacks must not interrupt chat */ }
        emit('feedback', { messageId: id, rating })
      }
    } else if (action === 'react') {
      const message = messages.find((item) => item.id === button.dataset.id)
      const reaction = button.dataset.reaction ?? ''
      if (message) { message.reaction = message.reaction === reaction ? undefined : reaction; save(); renderMessages(); emit('message-reaction', { messageId: message.id, reaction: message.reaction ?? null }) }
    } else if (action === 'jump-to-message') flashMessage(id)
    else if (action === 'quick') { const faq = faqs[Number(button.dataset.index)]; if (faq) void sendMessage(faq.question) }
    else if (action === 'attach') fileInput.click()
    else if (action === 'remove-file') {
      const file = attachments.find((item) => item.id === id)
      if (file?.previewUrl) { URL.revokeObjectURL(file.previewUrl); objectUrls.delete(file.previewUrl) }
      attachments = attachments.filter((item) => item.id !== id)
      renderQueue()
    } else if (action === 'record') { if (recorder?.state === 'recording') stopRecording(false); else void startRecording() }
    else if (action === 'stop-recording') stopRecording(false)
    else if (action === 'cancel-recording') stopRecording(true)
    else if (action === 'emoji') emojiPopover.hidden = !emojiPopover.hidden
    else if (action === 'preview-image') setImagePreview(button.dataset.url ?? '', button.dataset.alt ?? 'تصویر')
    else if (action === 'close-image') { lightbox.hidden = true; lightboxImage.removeAttribute('src') }
    else if (button.dataset.emoji) { input.value += button.dataset.emoji; updateSendState(); input.focus(); emojiPopover.hidden = true }
  }

  shadow.addEventListener('click', onClick)
  shadow.addEventListener('submit', (event) => {
    const form = event.target
    if (form instanceof HTMLFormElement) { event.preventDefault(); if (form.dataset.form === 'send') void sendMessage() }
  })
  shadow.addEventListener('keydown', (event) => {
    if (event.target === input && event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() }
    if (event instanceof KeyboardEvent && event.key === 'Escape') {
      if (thread.querySelector('.gft-toolbar:not([hidden])')) {
        thread.querySelectorAll<HTMLElement>('.gft-toolbar').forEach((menu) => { menu.hidden = true })
        thread.querySelectorAll<HTMLButtonElement>('.gft-message-more').forEach((button) => button.setAttribute('aria-expanded', 'false'))
      } else if (replyToId) hideReply()
      else if (!lightbox.hidden) { lightbox.hidden = true; lightboxImage.removeAttribute('src') }
      else if (!panel.hidden) close()
    }
  })
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 120)}px`; updateSendState() })
  fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files ?? [])); fileInput.value = '' })
  input.addEventListener('paste', (event) => {
    const files = Array.from(event.clipboardData?.items ?? []).filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter((item): item is File => Boolean(item))
    if (files.length) { event.preventDefault(); addFiles(files) }
  })
  scroll.addEventListener('dragover', (event) => { if ((event as DragEvent).dataTransfer?.types.includes('Files')) event.preventDefault() })
  scroll.addEventListener('drop', (event) => { const drag = event as DragEvent; if (drag.dataTransfer?.files.length) { event.preventDefault(); addFiles(Array.from(drag.dataTransfer.files)) } })
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) { lightbox.hidden = true; lightboxImage.removeAttribute('src') } })

  renderMessages(true)
  updateSendState()
  if (config.initiallyOpen) open()
  return {
    open,
    close,
    toggle,
    sendMessage: (text) => { if (panel.hidden) open(); void sendMessage(text) },
    identify: (id) => { visitorId = id.trim(); try { localStorage.setItem(visitorKey, visitorId) } catch { /* storage disabled */ }; emit('identify', { visitorId }) },
    destroy: () => {
      destroyed = true
      window.clearTimeout(noticeTimer)
      window.clearTimeout(deleteTimer)
      window.clearTimeout(clearArmTimer)
      window.clearInterval(recordingTimer)
      if (recorder?.state === 'recording') { discardRecording = true; recorder.stop() }
      stream?.getTracks().forEach((track) => track.stop())
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
      objectUrls.clear()
      host.remove()
      if (window.GoftaChatWidget) delete window.GoftaChatWidget
    },
  }
}

declare global {
  interface Window { GoftaChatConfig?: GoftaChatConfig; GoftaChatWidget?: GoftaChatApi }
}
