/*export async function checkAuthentication(): Promise<boolean> {
    try {
        const response = await fetch('http://localhost:3000/api/ping', {
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}*/
export async function checkAuthentication(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:3000/api/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }