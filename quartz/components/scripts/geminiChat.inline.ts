type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const STORAGE_KEY = "foundations-gemini-chat"

function createMessageElement(role: ChatMessage["role"], content: string) {
  const message = document.createElement("div")
  const paragraph = document.createElement("p")
  message.className = `gemini-chat-message ${role}`
  paragraph.textContent = content
  message.append(paragraph)
  return message
}

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const messages = saved ? JSON.parse(saved) : []
    return Array.isArray(messages)
      ? messages.filter(
          (message): message is ChatMessage =>
            ["user", "assistant"].includes(message?.role) && typeof message.content === "string",
        )
      : []
  } catch {
    return []
  }
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)))
}

document.addEventListener("nav", () => {
  const chat = document.querySelector<HTMLElement>(".gemini-chat")
  const toggle = chat?.querySelector<HTMLButtonElement>(".gemini-chat-toggle")
  const close = chat?.querySelector<HTMLButtonElement>(".gemini-chat-close")
  const panel = chat?.querySelector<HTMLElement>(".gemini-chat-panel")
  const messagesEl = chat?.querySelector<HTMLElement>(".gemini-chat-messages")
  const form = chat?.querySelector<HTMLFormElement>(".gemini-chat-form")
  const input = chat?.querySelector<HTMLTextAreaElement>(".gemini-chat-input")
  const send = chat?.querySelector<HTMLButtonElement>(".gemini-chat-send")
  const workerUrl = chat?.dataset.workerUrl

  if (
    !chat ||
    !toggle ||
    !close ||
    !panel ||
    !messagesEl ||
    !form ||
    !input ||
    !send ||
    !workerUrl
  ) {
    return
  }

  let messages = loadMessages()

  const renderSavedMessages = () => {
    for (const message of messages) {
      messagesEl.append(createMessageElement(message.role, message.content))
    }
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  const setOpen = (open: boolean) => {
    chat.classList.toggle("is-open", open)
    panel.setAttribute("aria-hidden", String(!open))
    toggle.setAttribute("aria-expanded", String(open))
    toggle.setAttribute("aria-label", open ? "Close chat" : "Open chat")

    if (open) {
      window.setTimeout(() => input.focus(), 80)
    }
  }

  const appendMessage = (message: ChatMessage) => {
    messages.push(message)
    saveMessages(messages)
    messagesEl.append(createMessageElement(message.role, message.content))
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  const setBusy = (busy: boolean) => {
    chat.classList.toggle("is-busy", busy)
    input.disabled = busy
    send.disabled = busy
  }

  const sendMessage = async (content: string) => {
    appendMessage({ role: "user", content })
    setBusy(true)

    const thinking = createMessageElement("assistant", "Thinking...")
    thinking.classList.add("is-thinking")
    messagesEl.append(thinking)
    messagesEl.scrollTop = messagesEl.scrollHeight

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })
      const data = await response.json()

      thinking.remove()

      if (!response.ok) {
        appendMessage({
          role: "assistant",
          content: data.error || data.details || "Something went wrong.",
        })
        return
      }

      appendMessage({
        role: "assistant",
        content: data.reply || "I could not generate a response.",
      })
    } catch {
      thinking.remove()
      appendMessage({
        role: "assistant",
        content: "I could not reach the chat service. Please try again in a moment.",
      })
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    const content = input.value.trim()
    if (!content) return
    input.value = ""
    void sendMessage(content)
  }

  const onInputKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      form.requestSubmit()
    }
  }

  const onToggle = () => setOpen(!chat.classList.contains("is-open"))
  const onClose = () => setOpen(false)
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false)
    }
  }

  renderSavedMessages()
  toggle.addEventListener("click", onToggle)
  close.addEventListener("click", onClose)
  form.addEventListener("submit", onSubmit)
  input.addEventListener("keydown", onInputKeydown)
  document.addEventListener("keydown", onEscape)

  window.addCleanup(() => {
    toggle.removeEventListener("click", onToggle)
    close.removeEventListener("click", onClose)
    form.removeEventListener("submit", onSubmit)
    input.removeEventListener("keydown", onInputKeydown)
    document.removeEventListener("keydown", onEscape)
  })
})
