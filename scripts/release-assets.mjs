import { spawnSync } from 'node:child_process'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Create a missing Release as a draft. A published Release is left untouched. A draft only gains new asset names. */
export function releaseAssetPlan({ isDraft, existingNames = [], uploadNames }) {
  if (isDraft === undefined) return { action: 'create' }
  if (isDraft !== true) return { action: 'fail', reason: 'published' }
  const clash = uploadNames.filter(name => existingNames.includes(name))
  if (clash.length) return { action: 'fail', reason: 'asset', clash }
  return { action: 'upload' }
}

function gh(args) {
  return spawnSync('gh', args, { encoding: 'utf8' })
}

function fail(result) {
  process.stderr.write(result.stderr || '')
  process.exit(result.status || 1)
}

function main() {
  const tag = process.env.RELEASE_TAG
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag ?? '')) {
    console.error('RELEASE_TAG')
    process.exit(1)
  }
  const files = process.argv.slice(2)
  if (!files.length) {
    console.error('assets')
    process.exit(1)
  }
  const list = gh(['release', 'list', '--limit', '1000', '--json', 'tagName,isDraft'])
  if (list.status !== 0) fail(list)
  const listed = list.stdout ?? ''
  if (listed.trim() === '') {
    console.error('release list was empty')
    process.exit(1)
  }
  let releases
  try {
    releases = JSON.parse(listed)
  } catch {
    console.error('release list was not valid JSON')
    process.exit(1)
  }
  if (!Array.isArray(releases)) {
    console.error('release list was not an array')
    process.exit(1)
  }
  const match = releases.find(item => item.tagName === tag)
  if (!match && releases.length === 1000) {
    console.error(`release list returned 1000 entries and did not include ${tag}; not creating a release`)
    process.exit(1)
  }
  const uploadNames = files.map(file => basename(file))
  if (match && match.isDraft !== true) {
    console.error(`release ${tag} is already published and was left unchanged`)
    process.exit(1)
  }
  let existingNames = []
  if (match) {
    const view = gh(['release', 'view', tag, '--json', 'assets'])
    if (view.status !== 0) fail(view)
    existingNames = JSON.parse(view.stdout).assets.map(asset => asset.name)
  }
  const plan = releaseAssetPlan({ isDraft: match ? match.isDraft : undefined, existingNames, uploadNames })
  if (plan.action === 'fail' && plan.reason === 'asset') {
    console.error(`release asset already exists and was left unchanged: ${plan.clash.join(', ')}`)
    process.exit(1)
  }
  const version = tag.slice(1)
  const command = plan.action === 'create'
    ? ['release', 'create', tag, '--draft', '--verify-tag', '--title', `${tag} — PWA & Mobile`, '--notes-file', `docs/release-${version}.md`, ...files]
    : ['release', 'upload', tag, ...files]
  const result = gh(command)
  if (result.status !== 0) fail(result)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
