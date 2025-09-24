
import { API_BASE } from "../../variable"
export async function checkAuthentication(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
