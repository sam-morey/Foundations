import { QuartzComponent, QuartzComponentConstructor } from "./types"
import styles from "./styles/geminiChat.scss"
// @ts-ignore
import script from "./scripts/geminiChat.inline"

interface GeminiChatOptions {
  workerUrl: string
}

const GeminiChat: QuartzComponentConstructor<GeminiChatOptions> = (opts) => {
  const Chat: QuartzComponent = () => {
    return (
      <aside class="gemini-chat" data-worker-url={opts.workerUrl} aria-label="Foundations chat">
        <button
          class="gemini-chat-toggle"
          type="button"
          aria-label="Open chat"
          aria-expanded="false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.6 8.6 0 0 1-7.7 4.7 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.3A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" />
          </svg>
        </button>
        <section class="gemini-chat-panel" aria-label="Chat with Foundations" aria-hidden="true">
          <header class="gemini-chat-header">
            <div>
              <p>Foundations Chat</p>
              <span>Ask about these notes</span>
            </div>
            <button class="gemini-chat-close" type="button" aria-label="Close chat">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div class="gemini-chat-messages" role="log" aria-live="polite">
            <div class="gemini-chat-message assistant">
              <p>Hi. Ask me a question about the Bible, a note, or a theme you are exploring.</p>
            </div>
          </div>
          <form class="gemini-chat-form">
            <textarea
              class="gemini-chat-input"
              name="message"
              rows={2}
              placeholder="Ask a question..."
              aria-label="Message"
            ></textarea>
            <button class="gemini-chat-send" type="submit" aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </section>
      </aside>
    )
  }

  Chat.css = styles
  Chat.afterDOMLoaded = script

  return Chat
}

export default GeminiChat
