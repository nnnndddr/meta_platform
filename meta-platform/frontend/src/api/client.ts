import { useNotificationStore } from '@/store/notificationStore'

const BASE_URL = '/api'

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const userId = useNotificationStore.getState().currentUser?.id
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'X-User-ID': userId } : {}),
    ...extra,
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
