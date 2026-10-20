import { spawnSync } from 'node:child_process'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'

/** A new Release is created as a draft. An existing Release only gains assets that are not already attached. */
export function releaseAssetPlan({ releaseExists, existingNames, uploadNames }) {
  if (!releaseExists) return { action: 'create' }
  const clash = uploadNames.filter(name => existingNames.includes(name))
  if (clash.length) return { action: 'fail', clash }
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
  const view = gh(['release', 'view', tag, '--json', 'assets'])
  const missing = view.status !== 0 && /not found/i.test(`${view.stderr}\n${view.stdout}`)
  if (view.status !== 0 && !missing) fail(view)
  const existingNames = missing ? [] : JSON.parse(view.stdout).assets.map(asset => asset.name)
  const plan = releaseAssetPlan({
    releaseExists: !missing,
    existingNames,
    uploadNames: files.map(file => basename(file)),
  })
  if (plan.action === 'fail') {
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
