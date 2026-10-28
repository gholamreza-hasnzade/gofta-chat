import { mountChatWidget, type GoftaChatConfig } from './widget'

const script = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null
const attributes = script?.dataset
const fromScript: Partial<GoftaChatConfig> = {
  ...(attributes?.siteId ? { siteId: attributes.siteId } : {}),
  ...(attributes?.brandName ? { brandName: attributes.brandName } : {}),
  ...(attributes?.assistantName ? { assistantName: attributes.assistantName } : {}),
  ...(attributes?.welcomeMessage ? { welcomeMessage: attributes.welcomeMessage } : {}),
  ...(attributes?.primaryColor ? { primaryColor: attributes.primaryColor } : {}),
  ...(script?.nonce ? { styleNonce: script.nonce } : {}),
  ...(attributes?.direction === 'ltr' || attributes?.direction === 'rtl' ? { direction: attributes.direction } : {}),
  ...(attributes?.position === 'left' || attributes?.position === 'right' ? { position: attributes.position } : {}),
  ...(attributes?.initiallyOpen ? { initiallyOpen: attributes.initiallyOpen === 'true' } : {}),
}
const config: GoftaChatConfig = { ...fromScript, ...window.GoftaChatConfig }

function boot() {
  if (!window.GoftaChatWidget) window.GoftaChatWidget = mountChatWidget(config)
}

if (document.body) boot()
else document.addEventListener('DOMContentLoaded', boot, { once: true })
