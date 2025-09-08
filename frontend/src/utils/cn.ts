import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function for merging Tailwind CSS classes with clsx
 * Handles conditional classes and removes duplicates
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}