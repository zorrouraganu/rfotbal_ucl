import "dotenv/config";
import { importEspnLeaguePhaseFixtures } from "../src/lib/live/fixtureImport";
import { prisma } from "../src/lib/prisma";

importEspnLeaguePhaseFixtures({ allowDemoPredictionReset: process.argv.includes("--replace-demo-predictions") })
  .then((result) => console.log(`ESPN league phase ready: ${result.teams} teams, ${result.matches} matches${result.replacedDemoData ? "; demo schedule replaced" : "; fixtures refreshed"}.`))
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
