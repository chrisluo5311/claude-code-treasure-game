---
description: Deploy this project to Vercel and report the live URL
allowed-tools: Bash(vercel:*), Bash(npx vercel:*), Bash(npm run build:*), Bash(npm install:*)
---

Deploy the current project to Vercel production and give me the public URL at the end.

Follow these steps:

1. **Check the Vercel CLI**: Run `vercel --version`. If it's not installed, use `npx vercel` for all subsequent commands instead (or install it with `npm i -g vercel` if that fails).

2. **Check authentication**: Run `vercel whoami`. If not logged in, stop and tell me to run `! vercel login` myself (it's interactive), then re-run this command.

3. **Verify the build works locally**: Run `npm run build` first. If the build fails, show me the errors and stop — do not deploy a broken build.
   - Note: this is a Vite project that outputs to `./build/` (not the default `dist/`). Make sure Vercel uses the right output directory — pass it explicitly if needed or confirm `vercel.json` handles it.

4. **Deploy to production**: Run `vercel --prod --yes`. The `--yes` flag skips interactive prompts by accepting defaults (links/creates the project automatically).

5. **Report the result**: When the deployment finishes, clearly show me:
   - ✅ The production URL where I can view the project on the internet
   - The Vercel dashboard/inspect URL for this deployment

If any step fails, show the exact error output and suggest how to fix it instead of retrying blindly.

$ARGUMENTS
