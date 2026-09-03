-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompetitionStage" AS ENUM ('LEAGUE_PHASE', 'KNOCKOUT_PLAYOFF', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchLeg" AS ENUM ('SINGLE', 'FIRST', 'SECOND');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LOCKED', 'LIVE', 'HALF_TIME', 'FINAL', 'POSTPONED');

-- CreateEnum
CREATE TYPE "PredictionSelection" AS ENUM ('HOME', 'DRAW', 'AWAY', 'HOME_OR_DRAW', 'DRAW_OR_AWAY', 'HOME_OR_AWAY');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "redditId" TEXT NOT NULL,
    "redditUsername" TEXT NOT NULL,
    "redditUsernameNormalized" TEXT NOT NULL,
    "nickname" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seasonLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "simulationScenario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "espnId" TEXT,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "crestUrl" TEXT,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnockoutTie" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "stage" "CompetitionStage" NOT NULL,
    "label" TEXT NOT NULL,
    "bracketOrder" INTEGER NOT NULL,
    "firstTeamId" TEXT NOT NULL,
    "secondTeamId" TEXT NOT NULL,
    "qualifiedTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnockoutTie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "tieId" TEXT,
    "stage" "CompetitionStage" NOT NULL,
    "leg" "MatchLeg" NOT NULL DEFAULT 'SINGLE',
    "matchday" INTEGER,
    "label" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "kickoffUtc" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "liveHomeScore" INTEGER,
    "liveAwayScore" INTEGER,
    "homeScore90" INTEGER,
    "awayScore90" INTEGER,
    "homeDisciplinaryPoints" INTEGER NOT NULL DEFAULT 0,
    "awayDisciplinaryPoints" INTEGER NOT NULL DEFAULT 0,
    "manuallyLockedAt" TIMESTAMP(3),
    "resultFinalizedAt" TIMESTAMP(3),
    "visibleToPlayers" BOOLEAN NOT NULL DEFAULT true,
    "externalProvider" TEXT,
    "externalId" TEXT,
    "providerUpdatesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "manualOverride" BOOLEAN NOT NULL DEFAULT true,
    "providerLastSyncAt" TIMESTAMP(3),
    "providerLastStatus" TEXT,
    "providerRawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "selection" "PredictionSelection" NOT NULL,
    "qualifyingTeamId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSyncLog" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "action" TEXT NOT NULL,
    "statusBefore" TEXT,
    "statusAfter" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorRedditUsername" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_publicId_key" ON "Player"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_redditId_key" ON "Player"("redditId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_redditUsernameNormalized_key" ON "Player"("redditUsernameNormalized");

-- CreateIndex
CREATE INDEX "Player_redditUsername_idx" ON "Player"("redditUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_playerId_idx" ON "Session"("playerId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_publicId_key" ON "Competition"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_publicId_key" ON "Team"("publicId");

-- CreateIndex
CREATE INDEX "Team_competitionId_name_idx" ON "Team"("competitionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_competitionId_espnId_key" ON "Team"("competitionId", "espnId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_competitionId_abbreviation_key" ON "Team"("competitionId", "abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutTie_publicId_key" ON "KnockoutTie"("publicId");

-- CreateIndex
CREATE INDEX "KnockoutTie_competitionId_stage_idx" ON "KnockoutTie"("competitionId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutTie_competitionId_stage_bracketOrder_key" ON "KnockoutTie"("competitionId", "stage", "bracketOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Match_publicId_key" ON "Match"("publicId");

-- CreateIndex
CREATE INDEX "Match_competitionId_stage_matchday_idx" ON "Match"("competitionId", "stage", "matchday");

-- CreateIndex
CREATE INDEX "Match_kickoffUtc_idx" ON "Match"("kickoffUtc");

-- CreateIndex
CREATE INDEX "Match_tieId_leg_idx" ON "Match"("tieId", "leg");

-- CreateIndex
CREATE UNIQUE INDEX "Match_externalProvider_externalId_key" ON "Match"("externalProvider", "externalId");

-- CreateIndex
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");

-- CreateIndex
CREATE INDEX "Prediction_qualifyingTeamId_idx" ON "Prediction"("qualifyingTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_playerId_matchId_key" ON "Prediction"("playerId", "matchId");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_matchId_idx" ON "ProviderSyncLog"("matchId");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_provider_externalId_idx" ON "ProviderSyncLog"("provider", "externalId");

-- CreateIndex
CREATE INDEX "ProviderSyncLog_createdAt_idx" ON "ProviderSyncLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_viewedAt_idx" ON "PageView"("viewedAt");

-- CreateIndex
CREATE INDEX "PageView_visitorHash_idx" ON "PageView"("visitorHash");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_firstTeamId_fkey" FOREIGN KEY ("firstTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_secondTeamId_fkey" FOREIGN KEY ("secondTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_qualifiedTeamId_fkey" FOREIGN KEY ("qualifiedTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tieId_fkey" FOREIGN KEY ("tieId") REFERENCES "KnockoutTie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_qualifyingTeamId_fkey" FOREIGN KEY ("qualifyingTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSyncLog" ADD CONSTRAINT "ProviderSyncLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
