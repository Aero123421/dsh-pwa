import semver from 'semver'

/** npm 10 emits a scalar; npm 12 emits a singleton array even for an exact version. */
export function parseNpmViewVersion(output) {
  const result = JSON.parse(output)
  const version = Array.isArray(result) && result.length === 1 ? result[0] : result
  if (typeof version !== 'string' || !semver.valid(version)) throw new Error('Invalid published DSH version')
  return version
}
