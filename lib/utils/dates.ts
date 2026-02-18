import { format, isToday, isTomorrow, isThisWeek, parseISO, addDays, startOfDay, endOfDay } from 'date-fns'

export function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Tonight'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, MMM d')
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function getDateRange(filter: 'tonight' | 'tomorrow' | 'this-week' | 'this-weekend') {
  const now = new Date()

  switch (filter) {
    case 'tonight':
      return {
        start: startOfDay(now).toISOString(),
        end: endOfDay(now).toISOString(),
      }
    case 'tomorrow':
      return {
        start: startOfDay(addDays(now, 1)).toISOString(),
        end: endOfDay(addDays(now, 1)).toISOString(),
      }
    case 'this-weekend': {
      const day = now.getDay()
      const fridayOffset = day <= 5 ? 5 - day : 0
      const friday = startOfDay(addDays(now, fridayOffset))
      const sunday = endOfDay(addDays(friday, 2))
      return { start: friday.toISOString(), end: sunday.toISOString() }
    }
    case 'this-week':
      return {
        start: startOfDay(now).toISOString(),
        end: endOfDay(addDays(now, 7)).toISOString(),
      }
  }
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
