# Speak Easier

This is the translation app used in [Episode 1](https://aiavenue.show) of [AI Avenue](https://aiavenue.show).

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

