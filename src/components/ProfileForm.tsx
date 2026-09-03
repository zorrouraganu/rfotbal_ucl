"use client";

import { useActionState } from "react";
import { updateNicknameAction, type ProfileActionState } from "@/app/account/actions";

export function ProfileForm({ nickname }: { nickname: string | null }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(updateNicknameAction, {});
  return (
    <form action={action} className="profile-form">
      <label htmlFor="nickname">Poreclă afișată sub username</label>
      <div><input id="nickname" name="nickname" className="input" maxLength={32} defaultValue={nickname ?? ""} placeholder="Opțional" /><button className="button button-secondary" disabled={pending}>{pending ? "Se salvează…" : "Salvează"}</button></div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">Profil actualizat.</p>}
    </form>
  );
}
