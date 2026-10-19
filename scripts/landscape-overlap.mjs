// Painted overlap of a message with the conversation header.
// getBoundingClientRect includes the part the scrollport has already clipped.
// A transparent header still reads as overlapping the title and tabs; an opaque
// header covers that clipped band. A message that is actually visible inside the
// header fails either way.

export function headerBackgroundOpaque(color) {
  if (!color || color === 'transparent') return false
  const match = String(color).match(/rgba?\(([^)]+)\)/)
  if (!match) return true
  const parts = match[1].split(',').map(part => part.trim())
  if (parts.length < 4) return true
  return Number(parts[3]) > 0.99
}

export function messageHeaderOverlap({ header, scroll, message, headerOpaque }) {
  const clipTop = Math.max(message.top, scroll.top)
  const clipBottom = Math.min(message.bottom, scroll.bottom)
  const clipLeft = Math.max(message.left, scroll.left)
  const clipRight = Math.min(message.right, scroll.right)
  const visibleW = Math.min(clipRight, header.right) - Math.max(clipLeft, header.left)
  const visibleH = Math.min(clipBottom, header.bottom) - Math.max(clipTop, header.top)
  if (visibleW > 0.5 && visibleH > 0.5) return visibleW * visibleH
  if (headerOpaque) return 0
  const rawW = Math.min(message.right, header.right) - Math.max(message.left, header.left)
  const rawH = Math.min(message.bottom, header.bottom) - Math.max(message.top, header.top)
  if (rawW > 0.5 && rawH > 0.5 && message.bottom > scroll.top + 0.5) return rawW * rawH
  return 0
}
