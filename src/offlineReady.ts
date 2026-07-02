export type ServiceWorkerReady = { ready: Promise<unknown> }

export async function waitForOfflineReady(
  serviceWorker: ServiceWorkerReady | undefined =
    typeof navigator === 'undefined' ? undefined : navigator.serviceWorker,
): Promise<boolean> {
  if (!serviceWorker) return false

  try {
    await serviceWorker.ready
    return true
  } catch {
    return false
  }
}
