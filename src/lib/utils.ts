import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1]?.replace('H', '') || '0');
  const minutes = parseInt(match?.[2]?.replace('M', '') || '0');
  const seconds = parseInt(match?.[3]?.replace('S', '') || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(duration: string): string {
  const totalSeconds = parseDuration(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
