/**
 * Date & Time utilities with Philippine Standard Time (PHT, Asia/Manila) formatting
 */

export function formatPhilippineDateTime(
  dateInput: string | number | Date | undefined
): { full: string; time: string; date: string; relative: string } {
  if (!dateInput) {
    return { full: 'Just now', time: '', date: '', relative: 'Just now' };
  }

  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  // Verify date is valid
  if (isNaN(date.getTime())) {
    return { full: 'Recently', time: '', date: '', relative: 'Recently' };
  }

  // Philippine Standard Time (UTC+8 / Asia/Manila)
  const fullFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const timeFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const full = `${fullFormatter.format(date)} PHT`;
  const time = `${timeFormatter.format(date)} PHT`;
  const dateStr = dateFormatter.format(date);

  // Relative calculation
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  let relative = 'Just now';
  if (diffSec >= 60 && diffSec < 3600) {
    relative = `${Math.floor(diffSec / 60)}m ago`;
  } else if (diffSec >= 3600 && diffSec < 86400) {
    relative = `${Math.floor(diffSec / 3600)}h ago`;
  } else if (diffSec >= 86400 && diffSec < 604800) {
    relative = `${Math.floor(diffSec / 86400)}d ago`;
  } else if (diffSec >= 604800) {
    relative = dateStr;
  }

  return { full, time, date: dateStr, relative };
}
