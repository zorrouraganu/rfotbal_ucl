import { applySimulationScenario } from "../src/lib/simulation";
import { prisma } from "../src/lib/prisma";

applySimulationScenario("LEAGUE_PRE_M1")
  .then(async () => {
    if (process.env.NODE_ENV === "production") {
      await prisma.player.deleteMany({
        where: { redditId: { startsWith: "dev-" } },
      });
    }
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
