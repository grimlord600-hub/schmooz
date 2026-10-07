/**
 * Interactive login: phone → OTP → auth → sample API → save tokens.
 *
 * Usage:
 *   npx tsx examples/interactive-login.ts [config.json] [--show-logs=true|false]
 *   SCHMOOZE_SHOW_LOGS=false npm run example:login
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SchmoozeClient,
  loadConfig,
  persistTokensToConfigFile,
} from "../src/index.js";
import { formatContactNo } from "../src/auth/phone.js";
import { createExampleLogger, parseExampleArgs, redactSensitive } from "./log.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { configPath: configArg, showLogs } = parseExampleArgs(process.argv.slice(2));
const configPath = resolve(
  configArg ?? resolve(__dirname, "../../../schmooze_config.json"),
);
const log = createExampleLogger(showLogs);

const rl = createInterface({ input, output });

function printSummary(lines: string[]): void {
  for (const line of lines) {
    console.log(redactSensitive(line));
  }
}

try {
  log.info("Starting interactive login", { configPath, showLogs });

  const config = loadConfig(configPath);
  const client = new SchmoozeClient(config);

  const prefix = config.phoneCountryPrefix ?? "+91";
  const phoneRaw = await rl.question(
    `Mobile number (${prefix} prefix if omitted): `,
  );
  const contactNo = formatContactNo(phoneRaw, prefix);
  log.info("Contact normalized for API");

  log.info("Sending OTP");
  const sendRes = await client.auth.sendOtp({
    phoneNumber: contactNo,
    attempt: 1,
  });
  if (!sendRes.success) {
    log.error("sendOtp failed", { response: sendRes });
    process.exit(1);
  }
  log.info("OTP sent");

  const otp = (await rl.question("Enter OTP: ")).trim();
  if (!otp) {
    log.error("OTP required");
    process.exit(1);
  }

  log.info("Signing in");
  const auth = await client.auth.loginWithPhoneOtp({
    phoneNumber: contactNo,
    otp,
  });
  log.info("Login complete", { userId: auth.userId });

  log.info("Session bootstrap");
  await client.auth.completeSession();

  persistTokensToConfigFile(configPath, {
    accessToken: client.config.accessToken!,
    refreshToken: client.config.refreshToken,
  });
  log.info("Tokens persisted", { path: configPath });

  log.info("Calling API with new session");
  const profile = await client.users.getProfileMe();
  const communities = await client.communities.available();
  const posts = await client.posts.fetchPosts();
  const postCount = Array.isArray(posts.data) ? posts.data.length : 0;

  log.info("API smoke check finished", {
    profileSuccess: profile.success,
    communitiesSuccess: communities.success,
    postsSuccess: posts.success,
    postCount,
  });

  printSummary([
    `userId=${auth.userId}`,
    `profile.success=${profile.success}`,
    `communities.success=${communities.success}`,
    `posts.success=${posts.success} posts=${postCount}`,
  ]);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  log.error("Login flow failed", { error: message });
  process.exit(1);
} finally {
  rl.close();
}
