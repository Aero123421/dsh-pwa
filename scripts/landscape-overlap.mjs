// Visible overlap of a message with the conversation header.
// getBoundingClientRect includes the part the scrollport has already clipped.
// Real-device checks showed that band is not painted, so only the portion
// inside the scrollport counts. headerOpaque is accepted for existing callers.

export function headerBackgroundOpaque(color) {
  if (!color || color === 'transparent') return false
  const match = String(color).match(/rgba?\(([^)]+)\)/)
  if (!match) return true
  const parts = match[1].split(',').map(part => part.trim())
  if (parts.length < 4) return true
  return Number(parts[3]) > 0.99
}

export function messageHeaderOverlap({ header, scroll, message }) {
  const clipTop = Math.max(message.top, scroll.top)
  const clipBottom = Math.min(message.bottom, scroll.bottom)
  const clipLeft = Math.max(message.left, scroll.left)
  const clipRight = Math.min(message.right, scroll.right)
  const visibleW = Math.min(clipRight, header.right) - Math.max(clipLeft, header.left)
  const visibleH = Math.min(clipBottom, header.bottom) - Math.max(clipTop, header.top)
  if (visibleW > 0.5 && visibleH > 0.5) return visibleW * visibleH
  return 0
}
