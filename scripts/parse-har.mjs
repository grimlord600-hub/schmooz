import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const candidates = [
  join(root, "../../captures/HTTPToolkit_2026-10-07_21-34_263-requests/HTTPToolkit_full-traffic.har"),
  "D:/Downloads/HTTPToolkit_2026-10-07_21-34_263-requests/HTTPToolkit_full-traffic.har",
];

const harPath = candidates.find((p) => existsSync(p));
if (!harPath) {
  console.warn("parse-har: HAR not found, writing empty manifest");
  writeFileSync(
    join(root, "src/generated/endpoints.manifest.json"),
    JSON.stringify({ endpoints: [], source: null }, null, 2),
  );
  process.exit(0);
}

const har = JSON.parse(readFileSync(harPath, "utf8"));
const entries = har.entries ?? har.log?.entries ?? [];

const NO_AUTH = [
  "/iam-svc/v1/auth/authorize",
  "/iam-svc/v1/auth/otp/send",
  "/iam-svc/v1/auth/otp/verify",
  "/v2/users/welcome",
  "/v3/users/welcome",
  "/v2/auth/connected-accounts",
  "/v2/users/no-auth-force-update",
];

const HOSTS = new Set([
  "drogon.schmooze.tech",
  "iron-bank.schmooze.tech",
  "otel.schmooze.tech",
  "www.googleapis.com",
]);

function norm(pathname) {
  return pathname.replace(/\/\d+/g, "/{id}");
}

function category(host, path) {
  if (host === "otel.schmooze.tech") return "telemetry";
  if (host === "iron-bank.schmooze.tech") return "iap";
  if (host === "www.googleapis.com") return "firebase";
  if (path.startsWith("/iam-svc") || path.includes("/auth/")) return "auth";
  if (path.includes("/posts")) return "posts";
  if (path.includes("/matches")) return "matches";
  if (path.includes("/users")) return "users";
  if (path.includes("/third-party/s3")) return "assets";
  return "app";
}

const map = new Map();

for (const entry of entries) {
  const req = entry.request ?? entry;
  if (!req?.url) continue;
  let u;
  try {
    u = new URL(req.url);
  } catch {
    continue;
  }
  if (!HOSTS.has(u.host)) continue;
  const path = norm(u.pathname);
  const key = `${req.method} ${u.host}${path}`;
  if (map.has(key)) continue;
  const hasSig = (req.headers ?? []).some(
    (h) => h.name?.toLowerCase() === "clientsignature" && h.value,
  );
  const hasAuth = (req.headers ?? []).some(
    (h) => h.name?.toLowerCase() === "authorization" && h.value,
  );
  map.set(key, {
    method: req.method,
    host: u.host,
    path,
    category: category(u.host, u.pathname),
    requiresAccessToken:
      u.host === "drogon.schmooze.tech" &&
      !NO_AUTH.some((p) => u.pathname === p || u.pathname.startsWith(p)),
    requiresClientSignature: u.host !== "otel.schmooze.tech" && hasSig,
    samplePath: u.pathname,
    observedAuthorization: hasAuth,
  });
}

const endpoints = [...map.values()].sort((a, b) =>
  `${a.host}${a.path}`.localeCompare(`${b.host}${b.path}`),
);

writeFileSync(
  join(root, "src/generated/endpoints.manifest.json"),
  JSON.stringify({ source: harPath, generatedAt: new Date().toISOString(), endpoints }, null, 2),
);
console.log(`Wrote ${endpoints.length} endpoints from ${harPath}`);
