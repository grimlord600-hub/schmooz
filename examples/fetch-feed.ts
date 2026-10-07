import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SchmoozeClient, loadConfig } from "../src/index.js";
import { createExampleLogger, parseExampleArgs } from "./log.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { configPath: configArg, showLogs } = parseExampleArgs(process.argv.slice(2));
const configPath = resolve(
  configArg ?? resolve(__dirname, "../schmooze_config.json"),
);
const log = createExampleLogger(showLogs);

const config = loadConfig(configPath);
const client = new SchmoozeClient(config);

log.info("Fetching communities");
const communities = await client.communities.available();
log.info("Fetching posts");
const posts = await client.posts.fetchPosts();

const postCount = Array.isArray(posts.data) ? posts.data.length : 0;
console.log(
  `communities.success=${communities.success} posts.success=${posts.success} posts=${postCount}`,
);
