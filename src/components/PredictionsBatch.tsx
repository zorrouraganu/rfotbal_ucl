"use client";

import type { PredictionSelection } from "@prisma/client";
import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import {
  savePredictionsBatchAction,
  type PredictionBatchActionState,
} from "@/app/app/actions";

export type PredictionDraft = {
  matchPublicId: string;
  selection: PredictionSelection | null;
  qualifyingTeamPublicId: string | null;
  requiresQualifier: boolean;
};

type BatchContextValue = {
  pending: boolean;
  reportDraft: (matchPublicId: string, draft: PredictionDraft | null) => void;
};

const BatchContext = createContext<BatchContextValue>({ pending: false, reportDraft: () => undefined });

export function PredictionsBatch({
  children,
  hasUnsavedPredictions = false,
}: {
  children: React.ReactNode;
  hasUnsavedPredictions?: boolean;
}) {
  const [drafts, setDrafts] = useState<Map<string, PredictionDraft>>(() => new Map());
  const [state, setState] = useState<PredictionBatchActionState>({});
  const [pending, startTransition] = useTransition();

  const reportDraft = useCallback((matchPublicId: string, draft: PredictionDraft | null) => {
    setDrafts((current) => {
      const existing = current.get(matchPublicId);
      if (!draft && !existing) return current;
      if (draft && existing && sameDraft(existing, draft)) return current;
      const next = new Map(current);
      if (draft) next.set(matchPublicId, draft);
      else next.delete(matchPublicId);
      return next;
    });
  }, []);

  function saveAll(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await savePredictionsBatchAction({}, formData);
        setState(result);
        if (result.success) setDrafts(new Map());
      } catch {
        setState({ error: "Predicțiile nu au putut fi salvate." });
      }
    });
  }

  const context = useMemo(() => ({ pending, reportDraft }), [pending, reportDraft]);
  const outstanding = [...drafts.values()];
  const complete = outstanding.length > 0 && outstanding.every((draft) =>
    draft.selection && (!draft.requiresQualifier || draft.qualifyingTeamPublicId),
  );
  const payload = complete
    ? JSON.stringify(outstanding.map((draft) => ({
        matchPublicId: draft.matchPublicId,
        selection: draft.selection,
        qualifyingTeamPublicId: draft.qualifyingTeamPublicId,
      })))
    : "[]";

  return (
    <BatchContext.Provider value={context}>
      {children}
      {(hasUnsavedPredictions || outstanding.length > 0) && (
        <form action={saveAll} className="batch-save-form">
          <input type="hidden" name="predictions" value={payload} />
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
          {!outstanding.length && <p className="batch-save-note">Alege cel puțin o predicție pentru a o salva.</p>}
          {!!outstanding.length && !complete && <p className="batch-save-note">Completează toate selecțiile modificate înainte de salvare.</p>}
          <button type="submit" className="button button-primary batch-save-button" disabled={pending || !complete}>
            {pending ? "Se salvează…" : "Salvează toate predicțiile"}
          </button>
        </form>
      )}
    </BatchContext.Provider>
  );
}

export function usePredictionsBatch() {
  return useContext(BatchContext);
}

function sameDraft(first: PredictionDraft, second: PredictionDraft) {
  return first.selection === second.selection
    && first.qualifyingTeamPublicId === second.qualifyingTeamPublicId
    && first.requiresQualifier === second.requiresQualifier;
}
