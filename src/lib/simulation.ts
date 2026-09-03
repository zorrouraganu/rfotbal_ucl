import type { CompetitionStage, Match, Player, PredictionSelection, Prisma, Team } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { automaticFinalWinnerSide } from "@/lib/scoring";
import { buildLeagueStandings } from "@/lib/standings";

export const simulationScenarios = [
  { value: "LEAGUE_PRE_M1", label: "Înainte de etapa 1", description: "144 de meciuri deschise, fără rezultate." },
  { value: "LEAGUE_AFTER_M1", label: "După etapa 1", description: "Prima etapă este finalizată; etapa 2 urmează." },
  { value: "LEAGUE_BEFORE_M8", label: "Înainte de etapa 8", description: "Șapte etape finalizate, ultima etapă încă deschisă." },
  { value: "LEAGUE_COMPLETE", label: "După etapa 8", description: "Faza ligii este completă și clasamentul final este stabilit." },
  { value: "KNOCKOUT_PLAYOFFS", label: "Baraj — înainte de retur", description: "Tururile sunt jucate; retururile și echipa calificată pot fi prezise." },
  { value: "ROUND_OF_16", label: "Optimi — înainte de retur", description: "Barajele sunt încheiate; optimile sunt la jumătate." },
  { value: "QUARTER_FINAL", label: "Sferturi — înainte de retur", description: "Sferturile au tururile finalizate și retururile deschise." },
  { value: "SEMI_FINAL", label: "Semifinale — înainte de retur", description: "Semifinalele au tururile finalizate și retururile deschise." },
  { value: "FINAL", label: "Înainte de finală", description: "Finalistele sunt cunoscute; finala este deschisă." },
  { value: "COMPLETE", label: "Competiție încheiată", description: "Finala și toate punctajele sunt definitive." },
] as const;

export type SimulationScenario = (typeof simulationScenarios)[number]["value"];

export const demoPlayers = [
  { redditId: "dev-admin", redditUsername: "satibagipula", nickname: "Administrator" },
  { redditId: "dev-ana", redditUsername: "optic_oracle", nickname: "Ana" },
  { redditId: "dev-vlad", redditUsername: "pressingmerchant", nickname: "Vlad" },
  { redditId: "dev-mara", redditUsername: "false_nine", nickname: "Mara" },
  { redditId: "dev-radu", redditUsername: "late_winner", nickname: "Radu" },
  { redditId: "dev-ioana", redditUsername: "clean_sheet", nickname: "Ioana" },
];

export const demoTeams = [
  ["139", "Ajax Amsterdam", "Ajax", "AJA"], ["359", "Arsenal", "Arsenal", "ARS"],
  ["174", "AS Monaco", "Monaco", "MON"], ["105", "Atalanta", "Atalanta", "ATA"],
  ["93", "Athletic Club", "Athletic", "ATH"], ["1068", "Atlético Madrid", "Atlético", "ATM"],
  ["83", "Barcelona", "Barcelona", "BAR"], ["131", "Bayer Leverkusen", "Leverkusen", "B04"],
  ["132", "Bayern Munich", "Bayern", "BAY"], ["1929", "Benfica", "Benfica", "SLB"],
  ["2980", "Bodo/Glimt", "Bodo/Glimt", "BOD"], ["124", "Borussia Dortmund", "Dortmund", "DOR"],
  ["363", "Chelsea", "Chelsea", "CHE"], ["570", "Club Brugge", "Club Brugge", "BRU"],
  ["125", "Eintracht Frankfurt", "Frankfurt", "SGE"], ["909", "F.C. København", "København", "CPH"],
  ["10414", "FK Qarabag", "Qarabag", "QAR"], ["432", "Galatasaray", "Galatasaray", "GAL"],
  ["110", "Internazionale", "Inter", "INT"], ["111", "Juventus", "Juventus", "JUV"],
  ["2528", "Kairat Almaty", "Kairat", "KAI"], ["364", "Liverpool", "Liverpool", "LIV"],
  ["382", "Manchester City", "Man City", "MCI"], ["176", "Marseille", "Marseille", "OM"],
  ["114", "Napoli", "Napoli", "NAP"], ["361", "Newcastle United", "Newcastle", "NEW"],
  ["435", "Olympiacos", "Olympiacos", "OLY"], ["22281", "Pafos", "Pafos", "PAF"],
  ["160", "Paris Saint-Germain", "PSG", "PSG"], ["148", "PSV Eindhoven", "PSV", "PSV"],
  ["86", "Real Madrid", "Real Madrid", "RMA"], ["494", "Slavia Prague", "Slavia", "SLP"],
  ["2250", "Sporting CP", "Sporting", "SCP"], ["367", "Tottenham Hotspur", "Spurs", "TOT"],
  ["5807", "Union St.-Gilloise", "Union SG", "USG"], ["102", "Villarreal", "Villarreal", "VIL"],
] as const;

type Pairing = { homeIndex: number; awayIndex: number };

export function generateLeaguePairings(teamCount = 36, rounds = 8): Pairing[][] {
  if (teamCount % 2 !== 0) throw new Error("League fixture generation requires an even team count.");
  const rotation = Array.from({ length: teamCount }, (_, index) => index);
  const rawSchedule: Array<Array<{ edgeId: number; first: number; second: number }>> = [];
  let edgeId = 0;
  for (let round = 0; round < rounds; round += 1) {
    const pairings: Array<{ edgeId: number; first: number; second: number }> = [];
    for (let index = 0; index < teamCount / 2; index += 1) {
      const first = rotation[index];
      const second = rotation[teamCount - 1 - index];
      pairings.push({ edgeId, first, second });
      edgeId += 1;
    }
    rawSchedule.push(pairings);
    rotation.splice(1, 0, rotation.pop() as number);
  }
  const adjacency = Array.from({ length: teamCount }, () => [] as Array<{ edgeId: number; other: number }>);
  for (const round of rawSchedule) {
    for (const edge of round) {
      adjacency[edge.first].push({ edgeId: edge.edgeId, other: edge.second });
      adjacency[edge.second].push({ edgeId: edge.edgeId, other: edge.first });
    }
  }
  const used = Array(edgeId).fill(false) as boolean[];
  const orientation = Array<Pairing>(edgeId);
  for (let start = 0; start < teamCount; start += 1) {
    const stack = [start];
    while (stack.length) {
      const current = stack.at(-1) as number;
      let next = adjacency[current].pop();
      while (next && used[next.edgeId]) next = adjacency[current].pop();
      if (!next) {
        stack.pop();
        continue;
      }
      used[next.edgeId] = true;
      orientation[next.edgeId] = { homeIndex: current, awayIndex: next.other };
      stack.push(next.other);
    }
  }
  return rawSchedule.map((round) => round.map((edge) => orientation[edge.edgeId]));
}

export async function applySimulationScenario(scenario: SimulationScenario) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SIMULATION_RESET !== "true") {
    throw new Error("Simulation resets are disabled in production.");
  }
  if (!simulationScenarios.some((item) => item.value === scenario)) {
    throw new Error("Unknown simulation scenario.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.prediction.deleteMany();
    await tx.providerSyncLog.deleteMany();
    await tx.match.deleteMany();
    await tx.knockoutTie.deleteMany();
    await tx.team.deleteMany();
    await tx.competition.deleteMany();

    const players: Player[] = [];
    for (const demo of demoPlayers) {
      const normalized = demo.redditUsername.toLowerCase();
      const existing = await tx.player.findFirst({
        where: { OR: [{ redditId: demo.redditId }, { redditUsernameNormalized: normalized }] },
      });
      players.push(existing
        ? await tx.player.update({ where: { id: existing.id }, data: { isActive: true } })
        : await tx.player.create({
            data: { ...demo, redditUsernameNormalized: normalized },
          }));
    }

    const competition = await tx.competition.create({
      data: {
        publicId: "ucl-2026-27",
        name: "UEFA Champions League",
        seasonLabel: "2026–27",
        simulationScenario: scenario,
      },
    });

    const teams: Team[] = [];
    for (const [espnId, name, shortName, abbreviation] of demoTeams) {
      teams.push(await tx.team.create({
        data: {
          competitionId: competition.id,
          publicId: `ucl-team-${espnId}`,
          espnId,
          name,
          shortName,
          abbreviation,
          crestUrl: `https://a.espncdn.com/i/teamlogos/soccer/500/${espnId}.png`,
          coefficient: 120 - teams.length * 2.25,
        },
      }));
    }

    const completedMatchdays = completedLeagueMatchdays(scenario);
    const now = new Date();
    const createdLeagueMatches: Match[] = [];
    const schedule = generateLeaguePairings();
    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex += 1) {
      const matchday = roundIndex + 1;
      for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex += 1) {
        const pairing = schedule[roundIndex][matchIndex];
        const result = deterministicResult(pairing.homeIndex, pairing.awayIndex, matchday);
        const finalized = matchday <= completedMatchdays;
        createdLeagueMatches.push(await tx.match.create({
          data: {
            competitionId: competition.id,
            publicId: `ucl-2026-27-md${matchday}-${matchIndex + 1}`,
            stage: "LEAGUE_PHASE",
            leg: "SINGLE",
            matchday,
            label: `Etapa ${matchday}`,
            homeTeamId: teams[pairing.homeIndex].id,
            awayTeamId: teams[pairing.awayIndex].id,
            kickoffUtc: scenarioKickoff(now, matchday, completedMatchdays, matchIndex),
            venue: `${teams[pairing.homeIndex].shortName} Stadium`,
            status: finalized ? "FINAL" : "SCHEDULED",
            homeScore90: finalized ? result.home : null,
            awayScore90: finalized ? result.away : null,
            liveHomeScore: finalized ? result.home : null,
            liveAwayScore: finalized ? result.away : null,
            homeDisciplinaryPoints: finalized ? (pairing.homeIndex + matchday) % 4 : 0,
            awayDisciplinaryPoints: finalized ? (pairing.awayIndex + matchday + 1) % 4 : 0,
            resultFinalizedAt: finalized ? new Date(now.getTime() - 60_000) : null,
          },
        }));
      }
    }

    const standings = buildLeagueStandings(
      teams,
      createdLeagueMatches.map((match) => ({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore90: match.homeScore90,
        awayScore90: match.awayScore90,
        homeDisciplinaryPoints: match.homeDisciplinaryPoints,
        awayDisciplinaryPoints: match.awayDisciplinaryPoints,
        resultFinalizedAt: match.resultFinalizedAt,
      })),
    );
    const rankedTeams = standings.map((row) => teams.find((team) => team.id === row.id) as (typeof teams)[number]);

    const knockoutMatches = await seedKnockoutStages(tx, competition.id, rankedTeams, scenario, now);
    const allMatches = [...createdLeagueMatches, ...knockoutMatches];
    const selections: PredictionSelection[] = [
      "HOME", "DRAW", "AWAY", "HOME_OR_DRAW", "DRAW_OR_AWAY", "HOME_OR_AWAY",
    ];
    const predictions: Prisma.PredictionCreateManyInput[] = [];
    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      for (let matchIndex = 0; matchIndex < allMatches.length; matchIndex += 1) {
        const match = allMatches[matchIndex];
        const selection = selections[(playerIndex + matchIndex) % selections.length];
        const automaticFinalSide = match.stage === "FINAL" ? automaticFinalWinnerSide(selection) : null;
        const qualifyingTeamId = match.leg === "SECOND"
          ? ((playerIndex + matchIndex) % 2 === 0 ? match.homeTeamId : match.awayTeamId)
          : match.stage === "FINAL"
            ? automaticFinalSide === "HOME"
              ? match.homeTeamId
              : automaticFinalSide === "AWAY"
                ? match.awayTeamId
                : (playerIndex + matchIndex) % 2 === 0 ? match.homeTeamId : match.awayTeamId
            : null;
        predictions.push({
          playerId: players[playerIndex].id,
          matchId: match.id,
          selection,
          qualifyingTeamId,
        });
      }
    }
    if (predictions.length) await tx.prediction.createMany({ data: predictions });
  }, { timeout: 30_000 });
}

function completedLeagueMatchdays(scenario: SimulationScenario) {
  if (scenario === "LEAGUE_PRE_M1") return 0;
  if (scenario === "LEAGUE_AFTER_M1") return 1;
  if (scenario === "LEAGUE_BEFORE_M8") return 7;
  return 8;
}

function scenarioKickoff(now: Date, matchday: number, completed: number, matchIndex: number) {
  const dayOffset = matchday <= completed
    ? -(completed - matchday + 1) * 7
    : (matchday - completed) * 7;
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(matchIndex < 9 ? 17 : 20, matchIndex % 3 === 0 ? 45 : 0, 0, 0);
  return date;
}

function deterministicResult(homeIndex: number, awayIndex: number, matchday: number) {
  return {
    home: (homeIndex * 3 + matchday) % 4,
    away: (awayIndex + matchday * 2) % 3,
  };
}

async function seedKnockoutStages(
  tx: Prisma.TransactionClient,
  competitionId: string,
  rankedTeams: Array<{ id: string; shortName: string }>,
  scenario: SimulationScenario,
  now: Date,
): Promise<Match[]> {
  const stageSequence: CompetitionStage[] = [
    "KNOCKOUT_PLAYOFF", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL",
  ];
  const scenarioStage = scenario === "KNOCKOUT_PLAYOFFS" ? "KNOCKOUT_PLAYOFF"
    : scenario === "ROUND_OF_16" ? "ROUND_OF_16"
      : scenario === "QUARTER_FINAL" ? "QUARTER_FINAL"
        : scenario === "SEMI_FINAL" ? "SEMI_FINAL"
          : scenario === "FINAL" || scenario === "COMPLETE" ? "FINAL"
            : null;
  if (!scenarioStage) return [];

  const matches: Match[] = [];
  let participants = [
    ...Array.from({ length: 8 }, (_, index) => rankedTeams[8 + index]),
    ...Array.from({ length: 8 }, (_, index) => rankedTeams[23 - index]),
  ];
  let directRoundOf16 = rankedTeams.slice(0, 8);

  for (const stage of stageSequence) {
    if (stage === "ROUND_OF_16") {
      participants = [...directRoundOf16, ...participants];
      directRoundOf16 = [];
    }
    const currentStage = scenarioStage === stage;
    const shouldExist = stageSequence.indexOf(stage) <= stageSequence.indexOf(scenarioStage as CompetitionStage)
      || scenarioStage === "FINAL";
    if (!shouldExist) break;
    const resolved = !currentStage;
    const winners = [];
    const ordered = pairParticipants(participants);
    for (let index = 0; index < ordered.length; index += 1) {
      const [first, second] = ordered[index];
      const winner = index % 2 === 0 ? first : second;
      const tie = await tx.knockoutTie.create({
        data: {
          competitionId,
          publicId: `ucl-2026-27-${stage.toLowerCase()}-${index + 1}`,
          stage,
          label: `${stageLabel(stage)} ${index + 1}`,
          bracketOrder: index + 1,
          firstTeamId: first.id,
          secondTeamId: second.id,
          qualifiedTeamId: resolved ? winner.id : null,
        },
      });
      const firstResult = resolved
        ? (winner.id === first.id ? { home: 2, away: 0 } : { home: 0, away: 1 })
        : { home: 1, away: 1 };
      const firstLeg = await tx.match.create({
        data: {
          competitionId,
          tieId: tie.id,
          publicId: `${tie.publicId}-leg-1`,
          stage,
          leg: "FIRST",
          label: `${tie.label} — tur`,
          homeTeamId: first.id,
          awayTeamId: second.id,
          kickoffUtc: new Date(now.getTime() - 7 * 86_400_000),
          status: "FINAL",
          homeScore90: firstResult.home,
          awayScore90: firstResult.away,
          liveHomeScore: firstResult.home,
          liveAwayScore: firstResult.away,
          resultFinalizedAt: new Date(now.getTime() - 6 * 86_400_000),
        },
      });
      const secondResult = winner.id === first.id ? { home: 1, away: 1 } : { home: 2, away: 0 };
      const secondLeg = await tx.match.create({
        data: {
          competitionId,
          tieId: tie.id,
          publicId: `${tie.publicId}-leg-2`,
          stage,
          leg: "SECOND",
          label: `${tie.label} — retur`,
          homeTeamId: second.id,
          awayTeamId: first.id,
          kickoffUtc: resolved
            ? new Date(now.getTime() - 2 * 86_400_000)
            : new Date(now.getTime() + 2 * 86_400_000),
          status: resolved ? "FINAL" : "SCHEDULED",
          homeScore90: resolved ? secondResult.home : null,
          awayScore90: resolved ? secondResult.away : null,
          liveHomeScore: resolved ? secondResult.home : null,
          liveAwayScore: resolved ? secondResult.away : null,
          resultFinalizedAt: resolved ? new Date(now.getTime() - 86_400_000) : null,
        },
      });
      matches.push(firstLeg, secondLeg);
      winners.push(winner);
    }
    participants = winners;
    if (currentStage) return matches;
  }

  if (scenarioStage === "FINAL") {
    const [first, second] = participants;
    if (!first || !second) throw new Error("The final requires two semifinal winners.");
    const complete = scenario === "COMPLETE";
    const tie = await tx.knockoutTie.create({
      data: {
        competitionId,
        publicId: "ucl-2026-27-final",
        stage: "FINAL",
        label: "Finala",
        bracketOrder: 1,
        firstTeamId: first.id,
        secondTeamId: second.id,
        qualifiedTeamId: complete ? first.id : null,
      },
    });
    matches.push(await tx.match.create({
      data: {
        competitionId,
        tieId: tie.id,
        publicId: "ucl-2026-27-final-match",
        stage: "FINAL",
        leg: "SINGLE",
        label: "Finala",
        homeTeamId: first.id,
        awayTeamId: second.id,
        kickoffUtc: complete ? new Date(now.getTime() - 86_400_000) : new Date(now.getTime() + 3 * 86_400_000),
        status: complete ? "FINAL" : "SCHEDULED",
        homeScore90: complete ? 2 : null,
        awayScore90: complete ? 1 : null,
        liveHomeScore: complete ? 2 : null,
        liveAwayScore: complete ? 1 : null,
        resultFinalizedAt: complete ? new Date(now.getTime() - 80_000_000) : null,
      },
    }));
  }
  return matches;
}

function pairParticipants(participants: Array<{ id: string; shortName: string }>) {
  const half = participants.length / 2;
  return Array.from({ length: half }, (_, index) => [participants[index], participants[index + half]] as const);
}

function stageLabel(stage: CompetitionStage) {
  if (stage === "KNOCKOUT_PLAYOFF") return "Baraj";
  if (stage === "ROUND_OF_16") return "Optime";
  if (stage === "QUARTER_FINAL") return "Sfert";
  return "Semifinală";
}
