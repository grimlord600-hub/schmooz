# @schmooze/client

TypeScript client for the Schmooze app API: request signing, OTP login, Drogon/IAM endpoints, Firebase Identity Toolkit, and OTEL collector calls.

## Requirements

- Node.js 18+

## Install

```bash
npm install
npm run build
```

## Configuration

[`schmooze_config.json`](schmooze_config.json) ships with signing keys and device metadata. **`access_token` and `refresh_token` are empty** until you log in.

1. Set `device_id` and signing fields (`hmac_key`, `jwt_secret`, `magic_constant`) for your environment.
2. Run interactive login (below) or paste tokens from a capture into the same file locally.
3. **Do not commit real session tokens.** After login, `schmooze_config.json` is updated on disk—review `git diff` before pushing.

```ts
import { SchmoozeClient, loadConfig } from "@schmooze/client";

const client = new SchmoozeClient(loadConfig("./schmooze_config.json"));
```

Signing keys for app 5.2.9+ come from Firebase Remote Config (`request_signature_key`, `client_signature_key`, `request_signature_salt` → `magic_constant`).

## Usage

```ts
const posts = await client.posts.fetchPosts();
const communities = await client.communities.available();
await client.matches.defaultMatchAction(12345);
```

### Login (phone OTP)

The app flow: OTP → Firebase `fb_token` → `authorize` → `POST /v3/auth/login` → session bootstrap.

```ts
await client.auth.sendOtp({ phoneNumber: "9876543210", attempt: 1 });
const auth = await client.auth.loginWithPhoneOtp({
  phoneNumber: "9876543210",
  otp: "123456",
});
await client.auth.completeSession();
```

### Telemetry

OTEL collector methods accept opaque OTLP payloads (no `clientsignature`):

```ts
await client.telemetry.sendMetrics(buffer, "application/x-protobuf");
```

## Endpoint manifest

`npm run parse-har` regenerates `src/generated/endpoints.manifest.json`. Point it at a local HAR file if you have one (see `scripts/parse-har.mjs`); the committed manifest works without a capture.

## Tests

```bash
npm test
```

Includes signing parity checks (request hash + `clientsignature` JWT).

## Examples

```bash
npx tsx examples/fetch-feed.ts
npx tsx examples/fetch-feed.ts ./schmooze_config.json --show-logs=false
```

### Interactive login

```bash
npm run example:login
npm run example:login -- --show-logs=false
```

Prompts for mobile number and OTP, saves tokens to `schmooze_config.json`, then calls profile/communities/posts APIs. Logs use `ISO8601 LEVEL message`; phone numbers are redacted. Override with `SCHMOOZE_SHOW_LOGS=false`.
