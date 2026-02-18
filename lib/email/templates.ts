// Shared email wrapper for consistent styling
export function emailWrapper(content: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0f; color: #ffffff; padding: 40px 24px; border-radius: 12px;">
      ${content}
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="color: #52525b; font-size: 12px; margin: 0;">
          Eyes Wide Shut &middot; <a href="https://eyeswsapp.com" style="color: #52525b; text-decoration: underline;">eyeswsapp.com</a>
        </p>
      </div>
    </div>
  `
}

export function buttonStyle(bgColor = '#a855f7') {
  return `display: inline-block; background-color: ${bgColor}; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;`
}

export function alertBox(color: 'green' | 'red' | 'yellow' | 'purple', title: string, body: string) {
  const colors = {
    green: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80' },
    red: { bg: 'rgba(225, 29, 72, 0.1)', border: 'rgba(225, 29, 72, 0.3)', text: '#fb7185' },
    yellow: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: '#facc15' },
    purple: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' },
  }
  const c = colors[color]
  return `
    <div style="background-color: ${c.bg}; border: 1px solid ${c.border}; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
      <p style="color: ${c.text}; font-weight: 600; margin: 0 0 8px 0;">${title}</p>
      <p style="color: #a1a1aa; margin: 0; font-size: 14px;">${body}</p>
    </div>
  `
}
