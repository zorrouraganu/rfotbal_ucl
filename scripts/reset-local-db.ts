import "dotenv/config";
import { execFileSync } from "node:child_process";

execFileSync("npx", ["prisma", "migrate", "reset", "--force"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
