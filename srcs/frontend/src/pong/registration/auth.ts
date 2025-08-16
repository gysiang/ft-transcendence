export async function checkAuthentication(): Promise<boolean> {
    try {
        const response = await fetch('http://localhost:3000/api/ping', {
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}