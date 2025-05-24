import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDurationFromHours(decimalHours: number): string {
  if (isNaN(decimalHours) || decimalHours < 0) {
    // Instead of 'Invalid duration', returning 0 min might be safer for UI
    // or throw an error if strict handling is needed. For UI, '0 min' is less disruptive.
    return '0 min';
  }

  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }

  if (parts.length === 0) {
    // This covers the case where decimalHours is 0 or rounds to 0 total minutes.
    return '0 min';
  }

  return parts.join(' ');
}
