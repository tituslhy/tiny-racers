import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const distPath = process.argv[2] ? resolve(process.argv[2]) : join(process.cwd(), 'dist')
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
assert.equal(manifest.id, '/')
assert.equal(manifest.lang, 'en')
assert.deepEqual(manifest.categories, ['games', 'kids'])
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.orientation, 'landscape')
assert.deepEqual(
  manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
  expectedIcons,
)

const appleTouchIcon = [...html.matchAll(/<link\b[^>]*>/gi)].find(([tag]) =>
  /\brel=["']apple-touch-icon["']/i.test(tag),
)
assert.ok(appleTouchIcon, 'Missing Apple touch icon link')
assert.match(appleTouchIcon[0], /\bsizes=["']180x180["']/i)
assert.match(appleTouchIcon[0], /\bhref=["']\/icons\/apple-touch-icon-180\.png["']/i)
assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//)

for (const src of [...expectedIcons.map(({ src }) => src), '/icons/apple-touch-icon-180.png']) {
  assert.ok(existsSync(join(distPath, src)), `Missing emitted icon: ${src}`)
}

const localAssetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map(([, url]) => url)
  .filter((url) => !/^(?:https?:|data:|blob:|#)/.test(url))

const extractPrecacheManifest = (source) => {
  const markerIndex = source.indexOf('precacheAndRoute(')
  assert.notEqual(markerIndex, -1, 'Missing Workbox precacheAndRoute call')

  const arrayStart = source.indexOf('[', markerIndex)
  assert.notEqual(arrayStart, -1, 'Missing Workbox precache manifest array')

  let depth = 0
  let quote = null
  let escaped = false

  for (let index = arrayStart; index < source.length; index += 1) {
    const character = source[index]

    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }

    if (character === '"' || character === "'") quote = character
    else if (character === '[') depth += 1
    else if (character === ']') {
      depth -= 1
      if (depth === 0) return source.slice(arrayStart, index + 1)
    }
  }

  assert.fail('Unterminated Workbox precache manifest array')
}

const precacheManifest = extractPrecacheManifest(serviceWorker)
const precachedUrls = new Set(
  [...precacheManifest.matchAll(/\burl\s*:\s*["']([^"']+)["']/g)].map(([, url]) => url),
)

const assertPrecached = (url) => {
  const precachePath = url.replace(/^\//, '').split(/[?#]/, 1)[0]
  assert.ok(precachedUrls.has(precachePath), `Not precached: ${url}`)
}

for (const url of localAssetUrls) {
  assertPrecached(url)
}

for (const url of ['manifest.webmanifest', ...expectedIcons.map(({ src }) => src), 'index.html']) {
  assertPrecached(url)
}

assert.match(
  serviceWorker,
  /registerRoute\(new\s+[\w$]+\.NavigationRoute\([\w$]+\.createHandlerBoundToURL\(["']index\.html["']\)\)\)/,
  'Missing index.html navigation fallback',
)

console.log('PWA verification passed')
