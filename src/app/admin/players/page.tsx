import { AdminFrame } from "@/components/AdminFrame";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { togglePlayerActiveAction } from "@/app/admin/actions";

export default async function AdminPlayersPage() {
  const admin = await requireAdmin();
  const players = await prisma.player.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] });
  return (
    <AdminFrame player={admin}>
      <section className="admin-title"><div><p className="eyebrow">REDDIT OAUTH</p><h1>Jucători</h1></div><span>{players.length} conturi</span></section>
      <div className="admin-list">
        {players.map((player) => (
          <article key={player.id} className={!player.isActive ? "is-disabled" : ""}>
            <div><strong>u/{player.redditUsername}</strong>{player.nickname && <small>{player.nickname}</small>}<span>Creat {player.createdAt.toLocaleDateString("ro-RO")}</span></div>
            {player.id !== admin.id && <form action={togglePlayerActiveAction}><input type="hidden" name="playerPublicId" value={player.publicId} /><button className="button button-secondary">{player.isActive ? "Dezactivează" : "Reactivează"}</button></form>}
            {player.id === admin.id && <span className="admin-pill">ADMIN UNIC</span>}
          </article>
        ))}
      </div>
    </AdminFrame>
  );
}
