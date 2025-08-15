
export type ApiInit = RequestInit & {
    skipAuthRedirect?: boolean;
    skipAuthCheck?: boolean;
  };
export async function api<T = any>(input: string, init: ApiInit = {}): Promise<T> {
    const res = await fetch(input, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      ...init,
    });
  
    if (res.status === 204) return undefined as unknown as T;
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(text || res.statusText) as any;
      err.status = res.status;
  
      if (res.status === 401 && !init.skipAuthRedirect) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
  
      throw err;
    }
    
    return res.json() as Promise<T>;
  }
