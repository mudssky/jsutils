import { describe, expect, it } from 'vitest'

import {
  buildReleaseSection,
  findPreviousTag,
  shouldUpdatePackageVersion,
  upsertReleaseSection,
} from '../scripts/lib/release-sync.mjs'

describe('release sync helpers', () => {
  it('builds a release section with compare link and release notes', () => {
    expect(
      buildReleaseSection({
        version: '1.35.0',
        currentTag: 'v1.35.0',
        previousTag: 'v1.34.0',
        repoUrl: 'https://github.com/mudssky/jsutils',
        releaseUrl: 'https://github.com/mudssky/jsutils/releases/tag/v1.35.0',
        publishedAt: '2026-03-14T08:00:00.000Z',
        notes: '### Features\n\n- add retry-safe release sync',
      }),
    ).toBe(
      '# [1.35.0](https://github.com/mudssky/jsutils/compare/v1.34.0...v1.35.0) (2026-03-14)\n\n### Features\n\n- add retry-safe release sync\n',
    )
  })

  it('finds the previous tag by semantic version order', () => {
    expect(
      findPreviousTag(['v1.34.0', 'v1.32.1', 'v1.33.0'], 'v1.34.0'),
    ).toBe('v1.33.0')
  })

  it('upserts a release section and removes duplicate versions', () => {
    const changelog = `# [1.34.0](https://github.com/mudssky/jsutils/compare/v1.33.0...v1.34.0) (2026-03-14)

### Features

- current release

# [1.33.0](https://github.com/mudssky/jsutils/compare/v1.32.1...v1.33.0) (2026-03-14)

### Features

- previous release

# [1.33.0](https://github.com/mudssky/jsutils/compare/v1.32.1...v1.33.0) (2026-03-14)

### Features

- duplicate previous release
`

    expect(
      upsertReleaseSection(
        changelog,
        '1.35.0',
        '# [1.35.0](https://github.com/mudssky/jsutils/compare/v1.34.0...v1.35.0) (2026-03-15)\n\n### Features\n\n- next release\n',
      ),
    ).toBe(`# [1.35.0](https://github.com/mudssky/jsutils/compare/v1.34.0...v1.35.0) (2026-03-15)

### Features

- next release

# [1.34.0](https://github.com/mudssky/jsutils/compare/v1.33.0...v1.34.0) (2026-03-14)

### Features

- current release

# [1.33.0](https://github.com/mudssky/jsutils/compare/v1.32.1...v1.33.0) (2026-03-14)

### Features

- previous release
`)
  })

  it('prevents older unsynced versions from rolling package.json back', () => {
    expect(() =>
      shouldUpdatePackageVersion({
        currentVersion: '1.35.0',
        targetVersion: '1.34.0',
        hasTargetSection: false,
      }),
    ).toThrowError(/回退 package\.json/)
  })

  it('treats an already synced version as a no-op', () => {
    expect(
      shouldUpdatePackageVersion({
        currentVersion: '1.35.0',
        targetVersion: '1.35.0',
        hasTargetSection: true,
      }),
    ).toBe(false)
  })

  it('allows rerunning an older version only when it is already synced', () => {
    expect(
      shouldUpdatePackageVersion({
        currentVersion: '1.35.0',
        targetVersion: '1.34.0',
        hasTargetSection: true,
      }),
    ).toBe(false)
  })
})
