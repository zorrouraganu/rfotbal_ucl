import "dotenv/config";
import { validateEnvironment } from "../src/lib/env";

const result = validateEnvironment(process.env);
if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}
console.log("Environment looks usable.");
