import { applySimulationScenario } from "../src/lib/simulation";
import { prisma } from "../src/lib/prisma";

const scenario = (process.argv[2] ?? "LEAGUE_PRE_M1") as Parameters<typeof applySimulationScenario>[0];
applySimulationScenario(scenario)
  .then(async () => {
    console.log(`Applied UCL simulation scenario: ${scenario}`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
