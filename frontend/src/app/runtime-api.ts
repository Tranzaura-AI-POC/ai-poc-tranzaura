export function getApiBase(): string {
  try {
    const w: any = (window as any) || {};
    if (w.__env && typeof w.__env.API_BASE === 'string' && w.__env.API_BASE.length) return w.__env.API_BASE;
    const m = document.querySelector('meta[name="api-base-url"]') as HTMLMetaElement | null;
    if (m && m.content && m.content.length) return m.content;
  } catch {
    // ignore
  }
  return '/api';
}

export const API_BASE = getApiBase();
