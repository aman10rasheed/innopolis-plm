# Releasing a desktop update

The app auto-updates from **GitHub Releases**. Every running copy (macOS &
Windows) polls
`https://github.com/aman10rasheed/innopolis-plm/releases/latest/download/latest.json`
on launch and every 30 minutes. When a newer version is found, the user gets a
bottom-right toast — *"A fresh update is here ✨"* — with a **Restart & update**
button that downloads, installs, and relaunches the app
(`src/components/layout/update-checker.tsx`).

## One-time setup (already done locally, needs GitHub secrets)

Updates are cryptographically signed. The keypair lives at
`~/.tauri/innopolis-plm.key` (private — **never commit it**) and
`~/.tauri/innopolis-plm.key.pub` (public — embedded in `src-tauri/tauri.conf.json`).

Add one **repository secret** on GitHub
(*Settings → Secrets and variables → Actions → New repository secret*):

| Secret | Value |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | contents of `~/.tauri/innopolis-plm.key` (`cat ~/.tauri/innopolis-plm.key \| pbcopy`) |

The key has no password, so no `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` secret is
needed.

> ⚠️ Back the private key up somewhere safe. If it's lost, shipped apps can
> never be updated again (they only trust this key).

> ⚠️ The updater endpoint requires the release assets to be **publicly
> downloadable** — either make the repo public, or host releases in a separate
> public repo and point `plugins.updater.endpoints` there.

## Shipping an update

1. Bump the version (all three should match):
   - `src-tauri/tauri.conf.json` → `"version"` ← **this is what the updater compares**
   - `package.json` → `"version"`
   - `src-tauri/Cargo.toml` → `version`
2. Commit, tag, push:

   ```bash
   git add -A && git commit -m "release: v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. The **Release** workflow (`.github/workflows/release.yml`) builds macOS
   (Apple Silicon + Intel) and Windows installers, signs the updater bundles,
   and publishes a GitHub Release including `latest.json`.
4. Once the release is live, every open app shows the update toast within
   30 minutes (or immediately on next launch).

## How the pieces fit

- `src-tauri/tauri.conf.json` — `bundle.createUpdaterArtifacts` + `plugins.updater` (pubkey, endpoint)
- `src-tauri/src/lib.rs` — registers `tauri-plugin-updater` + `tauri-plugin-process`
- `src-tauri/capabilities/default.json` — grants `updater:default`, `process:allow-restart`
- `src/components/layout/update-checker.tsx` — the toast UX (mounted in the app shell)
