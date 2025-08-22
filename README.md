# Speak Easier

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/craigsdennis/ai-ave-speak-easier)

This is the translation app used in [Episode 1: Voice](https://aiavenue.show) of [AI Avenue](https://aiavenue.show).

It uses [ElevenLabs Dubbing API](https://elevenlabs.io/docs/capabilities/dubbing)

## Develop

Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars`

```bash
npm run dev
```

## Deploy

Remove the custom routes in [wrangler.jsonc](./wrangler.jsonc)

```bash
npm run deploy
```

