"use client";

import type { PredictionSelection } from "@prisma/client";
import { useActionState, useEffect, useState } from "react";
import { savePredictionAction, type PredictionActionState } from "@/app/app/actions";
import { usePredictionsBatch } from "@/components/PredictionsBatch";
import { automaticFinalWinnerSide, marketLabel, marketOptions } from "@/lib/scoring";

type Team = { publicId: string; name: string; shortName: string };

export function PredictionForm({
  matchPublicId,
  existingSelection,
  existingQualifierPublicId,
  qualifierTeams,
  winnerKind,
}: {
  matchPublicId: string;
  existingSelection: PredictionSelection | null;
  existingQualifierPublicId: string | null;
  qualifierTeams: Team[] | null;
  winnerKind: "qualifier" | "champion" | null;
}) {
  const { pending: batchPending, reportDraft } = usePredictionsBatch();
  const [state, formAction, pending] = useActionState<PredictionActionState, FormData>(
    savePredictionAction,
    {},
  );
  const [selectedSelection, setSelectedSelection] = useState<PredictionSelection | null>(existingSelection);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(existingQualifierPublicId);
  const automaticWinnerSide = selectedSelection && winnerKind === "champion"
    ? automaticFinalWinnerSide(selectedSelection)
    : null;
  const winnerLocked = winnerKind === "champion" && automaticWinnerSide !== null;
  const winnerWaitingForMarket = winnerKind === "champion" && selectedSelection === null;
  const automaticWinner = automaticWinnerSide === "HOME" ? qualifierTeams?.[0] : automaticWinnerSide === "AWAY" ? qualifierTeams?.[1] : null;
  const requiresQualifier = Boolean(qualifierTeams && winnerKind);

  useEffect(() => {
    const dirty = selectedSelection !== existingSelection
      || (requiresQualifier && selectedWinner !== existingQualifierPublicId);
    reportDraft(matchPublicId, dirty ? {
      matchPublicId,
      selection: selectedSelection,
      qualifyingTeamPublicId: selectedWinner,
      requiresQualifier,
    } : null);
  }, [existingQualifierPublicId, existingSelection, matchPublicId, reportDraft, requiresQualifier, selectedSelection, selectedWinner]);

  useEffect(() => () => reportDraft(matchPublicId, null), [matchPublicId, reportDraft]);

  function selectMarket(selection: PredictionSelection) {
    const previousAutomaticSide = selectedSelection && winnerKind === "champion"
      ? automaticFinalWinnerSide(selectedSelection)
      : null;
    const nextAutomaticSide = winnerKind === "champion" ? automaticFinalWinnerSide(selection) : null;
    setSelectedSelection(selection);
    if (nextAutomaticSide === "HOME") setSelectedWinner(qualifierTeams?.[0]?.publicId ?? null);
    else if (nextAutomaticSide === "AWAY") setSelectedWinner(qualifierTeams?.[1]?.publicId ?? null);
    else if (previousAutomaticSide) setSelectedWinner(null);
  }

  return (
    <form action={formAction} className="prediction-form">
      <input type="hidden" name="matchPublicId" value={matchPublicId} />
      <fieldset disabled={pending || batchPending}>
        <legend>Alege piața</legend>
        <div className="market-grid">
          {marketOptions.map((option) => (
            <label key={option.value} className="market-option">
              <input
                type="radio"
                name="selection"
                value={option.value}
                checked={selectedSelection === option.value}
                onChange={() => selectMarket(option.value)}
                required
              />
              <span className="market-code">{option.label}</span>
              <span className="market-desc">{option.description}</span>
              <small>+{option.points}p</small>
            </label>
          ))}
        </div>
      </fieldset>
      {qualifierTeams && winnerKind && (
        <fieldset disabled={pending || batchPending} className="qualifier-fieldset">
          <legend>{winnerKind === "champion" ? "Cine câștigă trofeul?" : "Cine se califică?"} <span>+2p</span></legend>
          {winnerKind === "champion" && (
            <p className={`winner-pick-note ${winnerLocked ? "is-locked" : ""}`}>
              {winnerWaitingForMarket
                ? "Alege mai întâi piața de rezultat."
                : winnerLocked && automaticWinner
                  ? `${automaticWinner.shortName} este selectată automat de pronosticul ${marketLabel(selectedSelection as PredictionSelection)}.`
                  : "Pentru această piață, alege manual câștigătoarea."}
            </p>
          )}
          {winnerLocked && automaticWinner && <input type="hidden" name="qualifyingTeamPublicId" value={automaticWinner.publicId} />}
          <div className="qualifier-grid">
            {qualifierTeams.map((team) => (
              <label key={team.publicId} className={winnerLocked && selectedWinner === team.publicId ? "is-auto-locked" : ""}>
                <input
                  type="radio"
                  name="qualifyingTeamPublicId"
                  value={team.publicId}
                  checked={selectedWinner === team.publicId}
                  onChange={() => setSelectedWinner(team.publicId)}
                  disabled={winnerLocked || winnerWaitingForMarket}
                  required={!winnerLocked}
                />
                <span>{team.shortName}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">Predicția a fost salvată.</p>}
      <button type="submit" className="button button-primary" disabled={pending || batchPending}>
        {pending ? "Se salvează…" : existingSelection ? "Actualizează predicția" : "Salvează predicția"}
      </button>
    </form>
  );
}
