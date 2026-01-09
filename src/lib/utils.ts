import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 缓存版本号 - 更新此值强制刷新所有资源
export const CACHE_VERSION = "v2";

// 为图片URL添加缓存破坏参数
export function cacheBust(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cb=${CACHE_VERSION}`;
}
