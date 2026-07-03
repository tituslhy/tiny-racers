import { describe, expect, it } from 'vitest'

import { waitForOfflineReady } from './offlineReady'

describe('waitForOfflineReady', () => {
  it('returns true after service-worker readiness resolves', async () => {
    await expect(waitForOfflineReady({ ready: Promise.resolve({}) })).resolves.toBe(true)
  })

  it('returns false when service workers are unavailable', async () => {
    await expect(waitForOfflineReady(undefined)).resolves.toBe(false)
  })

  it('returns false when readiness rejects', async () => {
    await expect(waitForOfflineReady({ ready: Promise.reject(new Error('blocked')) })).resolves.toBe(false)
  })
})
