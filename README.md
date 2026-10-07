# @schmooze/client

Minimal TypeScript client for the Schmooze app API (`drogon.schmooze.tech`), IAM auth, Firebase Identity Toolkit, and OTEL collector.

## Requirements

- Node.js 18+

## Install (local)

```bash
cd packages/schmooze-client
npm install
npm run build
```

## Configuration

Load signing keys and tokens from the project [`schmooze_config.json`](../../schmooze_config.json):

```ts
import { SchmoozeClient, loadConfig } from "@schmooze/client";

const client = new SchmoozeClient(loadConfig("../../schmooze_config.json"));
```

## Usage

```ts
const posts = await client.posts.fetchPosts();
const communities = await client.communities.available();
await client.matches.defaultMatchAction(12345);
```

### Login (OTP + Google / Firebase)

```ts
await client.auth.sendOtp({ phoneNumber: "9876543210", attempt: 1 });
await client.auth.verifyOtp({ otp: "123456", phoneNumber: "9876543210" });
const verified = await client.auth.verifyCustomToken(customTokenFromBackend);
await client.auth.getAccountInfo(verified.idToken);
const auth = await client.auth.authorize({
  idToken: verified.idToken,
  deviceKey: config.deviceId,
  firebaseId: verified.localId ?? "",
});
await client.auth.signIn(auth.authToken);
await client.auth.completeSession();
```

Or use `client.auth.loginWithPhoneAndGoogle({ ... })` when tokens are available.

### Telemetry

OTEL endpoints accept opaque OTLP bodies (as captured from the app):

```ts
await client.telemetry.sendMetrics(buffer, "application/x-protobuf");
```

## Endpoint manifest

`npm run parse-har` reads [`../../captures/HTTPToolkit_2026-10-07_21-34_263-requests/HTTPToolkit_full-traffic.har`](../../captures/HTTPToolkit_2026-10-07_21-34_263-requests/HTTPToolkit_full-traffic.har) and writes `src/generated/endpoints.manifest.json`.

## Tests

```bash
npm test
```

Signing vectors match [`schmooze_api.py`](../../schmooze_api.py) `--verify-capture`.

## Examples

```bash
npx tsx examples/fetch-feed.ts ../../schmooze_config.json
```

### Interactive login (phone + OTP)

Prompts for number and OTP, runs Firebase `fb_token` flow, saves tokens to config, then calls profile/feed APIs:

```bash
npm run example:login
# quiet (summary only)
npm run example:login -- --show-logs=false
# or
npx tsx examples/interactive-login.ts ../../schmooze_config.json --show-logs=true
```

Logs use `ISO8601 LEVEL message` lines. Phone numbers are never printed. Set `SCHMOOZE_SHOW_LOGS=false` for default quiet mode.
