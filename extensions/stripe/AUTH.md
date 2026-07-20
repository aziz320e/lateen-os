# Stripe — Authentication

Supported methods: API_KEY, WEBHOOK_SECRET

## Required Settings

- `secretKey`

## OAuth2 Flow

1. Configure client credentials in extension settings
2. Call `provider.authenticate(config)`
3. Store returned `credentialsRef` securely

## API Key / Bearer

Set required keys in `config.settings` before `testConnection` or `authenticate`.
