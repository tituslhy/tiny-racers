import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const distPath = join(process.cwd(), 'dist')
const manifest = JSON.parse(readFileSync(join(distPath, 'manifest.webmanifest'), 'utf8'))
const html = readFileSync(join(distPath, 'index.html'), 'utf8')
const serviceWorker = readFileSync(join(distPath, 'sw.js'), 'utf8')

const expectedIcons = [
  { src: '/icons/tiny-racers-192.png', sizes: '192x192', purpose: 'any' },
  { src: '/icons/tiny-racers-512.png', sizes: '512x512', purpose: 'any' },
  { src: '/icons/tiny-racers-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
]

assert.equal(manifest.start_url, '/')
assert.equal(manifest.scope, '/')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.orientation, 'landscape')
assert.deepEqual(
  manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
  expectedIcons,
)
assert.match(html, /apple-touch-icon-180\.png/)
assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//)

for (const src of [...expectedIcons.map(({ src }) => src), '/icons/apple-touch-icon-180.png']) {
  assert.ok(existsSync(join(distPath, src)), `Missing emitted icon: ${src}`)
}

const localAssetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map(([, url]) => url)
  .filter((url) => !/^(?:https?:|data:|blob:|#)/.test(url))

const assertPrecached = (url) => {
  const precachePath = url.replace(/^\//, '').split(/[?#]/, 1)[0]
  assert.ok(serviceWorker.includes(precachePath), `Not precached: ${url}`)
}

for (const url of localAssetUrls) {
  assertPrecached(url)
}

for (const url of ['manifest.webmanifest', ...expectedIcons.map(({ src }) => src), 'index.html']) {
  assertPrecached(url)
}

console.log('PWA verification passed')
