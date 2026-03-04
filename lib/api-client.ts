// lib/api-client.ts
export async function safeFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error("Request Timeout");
    throw error; // ה-Caller יטפל בזה ב-try/catch שלו
  } finally {
    clearTimeout(timeout);
  }
}
