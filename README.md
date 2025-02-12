# twitch-discord-bot

## Run locally

### Ensure ngrok is installed

- https://ngrok.com/downloads/windows

### Ensure env vars are set correctly

- tbd
- See `.env.template` for a template for the required `.env` file.

### Run it!

```sh
npm install
npm start:dev
```

## Deployment

Pushing to main will trigger an automatic deployment.  
If you've added or updated any command names or descriptions, manually trigger [the deploy-discord-commands action](https://github.com/jedster1111/twitch-discord-bot/actions/workflows/deploy-discord-commands.yml) from the GitHub action tab.
