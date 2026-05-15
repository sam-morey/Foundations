# Foundations Gemini Chat Worker

This Cloudflare Worker is a small backend proxy for a Gemini chat embedded in the Foundations Quartz site.
It keeps the Gemini API key out of browser code.

## One-Time Cloudflare Setup

From this folder:

```sh
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ALLOWED_ORIGIN
npm run deploy
```

Use your published Quartz site origin for `ALLOWED_ORIGIN`, for example:

```text
https://sam-morey.github.io
```

If the site is served from a custom domain, use that origin instead.

## GitHub Actions Deployment

The workflow at `.github/workflows/deploy-gemini-worker.yml` deploys this Worker when files in `cloudflare-worker/` change.

Add these repository secrets in GitHub:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The Gemini key is stored as a Cloudflare Worker secret, not a GitHub secret.

## API Shape

Send a `POST` request to the deployed Worker URL:

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

The Worker returns:

```json
{
  "reply": "Hello! How can I help?"
}
```
