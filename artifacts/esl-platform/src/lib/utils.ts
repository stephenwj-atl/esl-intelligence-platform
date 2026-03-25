import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function getRiskColor(score: number) {
  if (score <= 3.5) return "text-success";
  if (score <= 7) return "text-warning";
  return "text-destructive";
}

export function getRiskBgColor(score: number) {
  if (score <= 3.5) return "bg-success/10 border-success/20";
  if (score <= 7) return "bg-warning/10 border-warning/20";
  return "bg-destructive/10 border-destructive/20";
}
