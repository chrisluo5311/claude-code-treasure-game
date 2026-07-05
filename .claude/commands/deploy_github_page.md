---
description: Deploy this project to GitHub Pages and report the live URL
allowed-tools: Bash(git:*), Bash(gh:*), Bash(npm run build:*), Bash(npm install:*), Bash(npx vite build:*), Bash(curl:*)
---

Deploy the current project to GitHub Pages and give me the public URL at the end.

Follow these steps:

1. **Check prerequisites**: Run `gh --version` and `gh auth status`. If the GitHub CLI is missing, tell me how to install it (`brew install gh` on macOS; see https://cli.github.com for other platforms). If not authenticated, stop and guide me: tell me to run `! gh auth login` myself (it's interactive — choose GitHub.com and follow the browser prompts), then re-run this command. Do not continue until `gh auth status` succeeds.

2. **Install dependencies if needed**: If `node_modules/` does not exist, run `npm install` first — the build cannot run without it.

3. **Ensure a git repo with a GitHub remote I can push to exists**:
   - If this folder is not a git repo, run `git init -b main`, create a sensible `.gitignore` if missing (must ignore `node_modules/` and `build/`), then commit everything.
   - If there's no `origin` remote, create the repo with `gh repo create <repo-name> --public --source=. --remote=origin --push` (derive `<repo-name>` from the folder name, e.g. `claude-code-treasure-game`). GitHub Pages on free accounts requires a **public** repo — confirm with me before making it public if it isn't already.
   - If `origin` exists but belongs to someone else's account (e.g. this project was cloned) — check with `gh repo view` and compare the owner against `gh api user --jq .login`, or just try `git push` and watch for a permission error — create a new repo under MY account instead: `gh repo create <repo-name> --public --source=. --push` after repointing `origin` (`git remote remove origin` first), then continue with the new repo.
   - If the repo already exists and is mine, commit any pending changes and push `main`.

4. **Build with the correct base path**: GitHub Pages serves project sites from `https://<user>.github.io/<repo>/`, so build with `npx vite build --base=/<repo>/`. The output goes to `./build/` (configured in `vite.config.ts` — not the default `dist/`). If the build fails, show me the errors and stop — do not deploy a broken build.

5. **Publish the build to a `gh-pages` branch**: Push only the contents of `./build/` to a `gh-pages` branch, e.g.:
   ```bash
   git worktree add /tmp/gh-pages-deploy
   # copy build output in, commit on an orphan gh-pages branch, force-push
   ```
   or any equivalent approach (`git subtree push --prefix build origin gh-pages` works if `build/` is committed). Do NOT commit `build/` to `main`.

6. **Enable GitHub Pages** for the repo, serving from the `gh-pages` branch root:
   ```bash
   gh api repos/{owner}/{repo}/pages -X POST -f "source[branch]=gh-pages" -f "source[path]=/"
   ```
   If Pages is already enabled (409 error), that's fine — skip this step.

7. **Verify and report**: Poll `gh api repos/{owner}/{repo}/pages` until `status` is `built` (it can take a minute or two), then clearly show me:
   - Known failure mode: if the `pages build and deployment` workflow run fails at the deploy step with the generic error "Deployment failed, try again later" (check with `gh run view <id> --log-failed`), the `github-pages` deployment environment is stuck in a bad state. Fix it with `gh api -X DELETE repos/{owner}/{repo}/environments/github-pages` (it is auto-recreated), then trigger a new build with `gh api -X POST repos/{owner}/{repo}/pages/builds`.
   - Also verify the live URL actually serves: `curl -s -o /dev/null -w "%{http_code}" <url>` should return 200.
   - ✅ The live URL: `https://<user>.github.io/<repo>/`
   - The repo URL and the Pages settings URL (`https://github.com/<user>/<repo>/settings/pages`)

**Important caveat to mention in the final report**: this project has an Express API server (`server/index.js`, proxied at `/api`). GitHub Pages only hosts static files, so any feature that calls the API will not work on the deployed site — only the static/client-side game will.

If any step fails, show the exact error output and suggest how to fix it instead of retrying blindly.

$ARGUMENTS
