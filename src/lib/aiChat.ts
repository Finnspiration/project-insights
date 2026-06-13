// Lightweight bridge so any component can open the GlobalAIChat panel with a
// pre-filled question, without prop-drilling or a shared context. GlobalAIChat
// (mounted once at the app root) listens for this event.
export const AI_CHAT_ASK_EVENT = 'ai-chat:ask';

export function askAIChat(question: string) {
  window.dispatchEvent(new CustomEvent(AI_CHAT_ASK_EVENT, { detail: { question } }));
}
