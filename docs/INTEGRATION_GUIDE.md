# Integration Guide

Gofta Chat is distributed as a classic browser script. Build it once, host `dist/gofta-chat-widget.js`, and load it after setting `window.GoftaChatConfig`.

For TypeScript projects, add a declaration file such as `src/types/gofta-chat.d.ts`:

```ts
declare global {
  interface Window {
    GoftaChatConfig?: Record<string, unknown>;
    GoftaChatWidget?: {
      open(): void;
      close(): void;
      toggle(): void;
      sendMessage(message: string): void;
      identify(visitorId: string): void;
      destroy(): void;
    };
  }
}
export {};
```

## Plain HTML

```html
<script>
  window.GoftaChatConfig = {
    siteId: 'store-123',
    brandName: 'My Store',
    assistantName: 'Store Assistant',
    direction: 'ltr',
    position: 'right',
    onMessage: async (message, context) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });
      if (!response.ok) throw new Error('Chat request failed');
      return (await response.json()).reply;
    }
  };
</script>
<script src="/assets/gofta-chat-widget.js" defer></script>
```

## React

Load the script from a client-only component. Set the config before appending the script. Destroy the widget on unmount if the component owns its lifecycle.

```tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    GoftaChatConfig?: Record<string, unknown>;
    GoftaChatWidget?: { destroy(): void; open(): void };
  }
}

export function GoftaChat() {
  useEffect(() => {
    window.GoftaChatConfig = {
      siteId: 'react-store',
      brandName: 'My Store',
      assistantName: 'Support',
      direction: 'ltr'
    };

    const script = document.createElement('script');
    script.src = '/assets/gofta-chat-widget.js';
    script.async = true;
    script.dataset.goftaChatWidget = 'true';
    document.body.appendChild(script);

    return () => {
      window.GoftaChatWidget?.destroy();
      script.remove();
    };
  }, []);

  return null;
}
```

If the app can mount this component more than once, guard against appending duplicate scripts. In React Strict Mode, a shared script loader at the app-shell level is preferable to creating one script per route.

## Next.js App Router

The script must run in the browser. Create a client component and mount it in the root layout. Do not access `window` from a Server Component.

```tsx
'use client';

import { useEffect } from 'react';

export function GoftaWidgetLoader() {
  useEffect(() => {
    window.GoftaChatConfig = {
      siteId: 'next-store',
      brandName: 'My Store',
      assistantName: 'Support',
      direction: 'ltr'
    };

    const script = document.createElement('script');
    script.src = '/assets/gofta-chat-widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.GoftaChatWidget?.destroy();
      script.remove();
    };
  }, []);

  return null;
}
```

Render `<GoftaWidgetLoader />` once in `app/layout.tsx`. If your site uses a Content Security Policy, pass a valid `nonce` on the script element; the embed copies it to its Shadow DOM stylesheet.

## Vue 3

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

let script: HTMLScriptElement | undefined;

onMounted(() => {
  window.GoftaChatConfig = {
    siteId: 'vue-store',
    brandName: 'My Store',
    assistantName: 'Support',
    direction: 'ltr'
  };

  script = document.createElement('script');
  script.src = '/assets/gofta-chat-widget.js';
  script.async = true;
  document.body.appendChild(script);
});

onBeforeUnmount(() => {
  window.GoftaChatWidget?.destroy();
  script?.remove();
});
</script>

<template><div aria-hidden="true"></div></template>
```

## Programmatic control

After the script has loaded, use the global API:

```js
window.GoftaChatWidget.open();
window.GoftaChatWidget.close();
window.GoftaChatWidget.toggle();
window.GoftaChatWidget.sendMessage('Where is my order?');
window.GoftaChatWidget.identify('customer-42');
window.GoftaChatWidget.destroy();
```

The loader itself is asynchronous, so wait for its `load` event before calling the API if the script was dynamically inserted. The widget also emits `gofta:open`, `gofta:close`, and message events on `window`.

## CSS and position

The widget injects its compiled CSS into a Shadow DOM. Host-page selectors do not style the widget, and widget selectors do not leak into the host page. Configure `primaryColor`, `direction`, and `position` instead of targeting internal class names.
