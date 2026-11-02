import { cpSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const target = process.argv[2];
if (!target)
  throw new Error("Usage: npm run sync:school -- ../banpadeng-school-db");
const school = resolve(target),
  config = resolve(school, "wrangler.jsonc");
if (
  !existsSync(config) ||
  !readFileSync(config, "utf8").includes('"banpadeng-school-db"')
)
  throw new Error("Target must be the banpadeng-school-db checkout");
if (!existsSync("dist/client/index.html"))
  throw new Error("Run npm run build first");
const destination = resolve(school, "public/dmcreport");
mkdirSync(destination, { recursive: true });
// Keep older hashed assets so already-open browser tabs survive the release.
cpSync(resolve("dist/client"), destination, { recursive: true });
console.log("Copied production client into " + destination);
