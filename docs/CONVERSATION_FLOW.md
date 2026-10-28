# Conversation and Interaction Flow

This document describes what the browser widget does and where the host application's backend fits in.

## 1. Mount and initialize

```mermaid
flowchart LR
  A[Load gofta-chat-widget.js] --> B[Read GoftaChatConfig and script data attributes]
  B --> C[Create one Shadow DOM widget]
  C --> D[Restore local text history if enabled]
  D --> E[Show launcher]
  E -->|click| F[Open chat and focus composer]
```

The script is a singleton per page. Configuration on `window.GoftaChatConfig` takes precedence over supported `data-*` attributes. Calling `destroy()` removes the widget and its temporary object URLs.

## 2. Text message and assistant reply

```mermaid
sequenceDiagram
  actor Visitor
  participant Widget
  participant Host as Host application
  participant API as Host backend

  Visitor->>Widget: Type message and send
  Widget->>Widget: Render visitor bubble and persist text history
  Widget-->>Host: gofta:visitor-message
  alt onMessage is configured
    Widget->>Host: onMessage(text, context)
    Host->>API: Authenticated request (application-defined)
    API-->>Host: Assistant reply text
    Host-->>Widget: Resolve callback with reply
  else Demo mode
    Widget->>Widget: Match local demo FAQ or return sample response
  end
  Widget->>Widget: Render assistant bubble
  Widget-->>Host: gofta:assistant-message
```

### Replying to a specific message

1. Open the message's three-dot actions.
2. Choose **Reply**.
3. Confirm the quoted target shown above the composer, then send.
4. The visitor bubble contains a clickable quote; `onMessage` receives `context.replyTo` with the target message's `id`, `role`, and `text`.

## 3. Message actions and feedback

Actions stay out of the conversation until the three-dot control is activated. The available actions depend on message ownership:

| Message | Available actions |
|---|---|
| Visitor's own message | Reply, copy, edit, delete with undo, and emoji reaction |
| Assistant message | Reply, copy, emoji reaction, and helpful/not-helpful feedback |

The widget does not offer edit or delete controls for assistant messages. After a visitor selects an emoji reaction or rates an assistant reply, the selected mark is rendered on the related message. A visitor can click their reaction mark to remove it. Feedback is sent to the optional `onFeedback` callback and `gofta:feedback` event.

Deleting one of the visitor's messages removes it immediately and shows an undo control for seven seconds. The widget emits `gofta:message-deleted`; if restored, it emits `gofta:message-restored`.

## 4. Attachments and voice

```mermaid
flowchart TD
  A[Select, paste, or drop files] --> B{Type, size, and count valid?}
  B -- No --> C[Show validation notice]
  B -- Yes --> D[Show local preview in composer]
  D --> E[Visitor sends message]
  E --> F[Render visitor message]
  F --> G{onAttachment configured?}
  G -- Yes --> H[Call host upload callback for each file]
  G -- No --> I[Keep preview local; no upload occurs]
  H --> J{Upload successful?}
  J -- Yes --> K[Emit gofta:attachments-uploaded]
  J -- No --> L[Show upload error and do not request assistant reply]
```

Voice recording uses the browser `MediaRecorder` API. After recording, the visitor can preview the audio before sending. Microphone access requires permission and a secure origin (HTTPS or localhost). Without `onAttachment`, files and recordings are not sent to a server.

## 5. Handoff and failure behavior

- Selecting **Human agent** calls `onHandoffRequest(context)` when provided and emits `gofta:handoff-request`.
- If `onMessage` rejects, the widget renders a recoverable assistant error message and logs a diagnostic to the browser console.
- If `onAttachment` rejects, the visitor sees an upload notice and the assistant callback is skipped for that send.
- Starting a new conversation uses a two-step confirmation. Clearing also invalidates pending assistant responses so a late response does not repopulate the cleared thread.

## 6. Persistence model

When `persistHistory` is enabled, text messages, timestamps, reply references, edits, reactions, and feedback are stored in local storage, scoped by `siteId`. Binary file data is not stored. Conversation history stored by the previous widget version is migrated on first load when a matching legacy key is present. Set `persistHistory: false` to disable history persistence.
