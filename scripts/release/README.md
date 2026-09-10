# DiamondCrew release automation

This branch changes only CI/release files. It does not modify the application or reskin.
The product remains **DiamondCrew Server Manager**; `web-servermanager` is the repository name.

## Trigger and source

`.github/workflows/release.yml` runs on **push of a tag matching `v*`**. It checks out
that tag (not the latest main), verifies that HEAD resolves to the tag and confirms
Pterodactyl 1.15.1. It supports safe tag names such as `v1.0.1` or `v1.1.0-rc.1`.
It uses Node 22, Yarn Classic 1.22.22 and the existing frozen yarn.lock.

The tag's commit must contain the workflow and its helper files. Keeping the workflow
only on `release-automation` does not make future tags on the old main trigger it.
Merging/cherry-picking this automation commit into main before tagging is the normal
path. Tagging a commit on a different branch that contains the workflow also works;
being on the default branch is not itself a requirement for a tag-push trigger.

The existing `v1.0.0` points to `0d104f2` without this workflow. This branch does not
move/recreate that tag, create any new tag, create a release or deploy to DIA-01.
Pushing this branch alone does not run a tag-only workflow.

## Pipeline

1. Test release tooling and verify release source/history.
2. Run Gitleaks 8.30.1, downloaded with a pinned SHA256, against the release history.
3. Install frozen dependencies; run typecheck, lint, existing Jest tests and production build.
4. Stage only frontend files declared by `docs/diamondcrew-files.json` and current
   built assets from `public/assets/manifest.json`. Validate JS SRI. Old stored chunk
   names are replaced with the actual build manifest in the staged documentation.
5. Add `diamondcrew-build.json` at the archive root:

   ```json
   {
     "product": "DiamondCrew Server Manager",
     "basedOn": "Pterodactyl 1.15.1",
     "version": "<triggering git tag>",
     "sourceCommit": "<checked out commit>"
   }
   ```

6. Reject environment files, dependencies, cache, logs, Git data, private-key files,
   local archives, traversal and symlinks. Scan exact staged contents with Gitleaks.
7. Revalidate staged hashes, create tar.gz, verify its file list and regular-file types,
   extract into a fresh temporary directory and compare every extracted file hash.
8. Create SHA256 and verification report; transfer artifacts to a separate publish job.
9. Verify the transport SHA256, create a draft GitHub Release, upload all three assets,
   then publish. A failed build/scan/validation prevents publishing. An existing release
   is not overwritten; failed draft publication requires review before retrying.

Assets:

- `diamondcrew-server-manager-1.15.1.tar.gz`
- `diamondcrew-server-manager-1.15.1.tar.gz.sha256`
- `release-verification.json`

Use the new archive filename in the earlier deployment instructions. The archive is
an overlay for an existing compatible installation, not a complete Laravel installation.
It does not include backend files, Composer vendor, node_modules, `.env` or storage.
The underlying application's public browser libraries named `vendor` stay in Git,
but no vendor directory is included in the deployment archive.

## Secret scan review

The history contains four public default reCAPTCHA-key findings in the original
upstream commit. Their exact fingerprints are recorded in `public-defaults.gitleaksignore`.
The audit checks the complete upstream config hash in every commit before scanning;
changed keys fail. This is not a general exclusion of a file or a scanner rule.
The unmodified upstream favicon archive and schema are likewise checked against
reviewed SHA256 values; neither is shipped in the reskin archive.
Release-content scanning uses no exceptions.

GitHub's short-lived token is available only to the publish step with `contents: write`.
The build job has read-only permissions, checkout does not persist credentials, and
third-party actions are pinned to commit hashes. No SSH/server credentials are used.

## Validation and clean main history

Locally run `node --test scripts/release/package.test.cjs`,
`node --check scripts/release/package.cjs`, and `actionlint .github/workflows/release.yml`.
An end-to-end local package test can use an existing tag checkout, `RELEASE_TAG`,
a fresh `RUNNER_TEMP`, compiled assets and real Gitleaks JSON reports; it requires no new tag.

Recommended next step after review: merge this single CI-only commit through a PR,
using fast-forward where available (or squash into one CI-only commit). Keep the two
original commits untouched. Create a future version tag on the resulting commit only
when explicitly authorized; do not force-push main or move the published v1.0.0 tag.
