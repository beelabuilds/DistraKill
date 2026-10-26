export function sanitizeAssistantText(text: string): string {
  return text
    .replace(/```[\w-]*\s*/g, '')
    .replace(/```/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^(\s*)[-*]\s+/gm, '$1• ')
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/__(.*?)__/gs, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/(^|\s)\*(?=\s|$)/g, '$1')
    .replace(/(^|\s)_(?=\s|$)/g, '$1');
}
