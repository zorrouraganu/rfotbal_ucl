import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth-server";

export default async function HomePage() {
  redirect((await getCurrentPlayer()) ? "/account" : "/login");
}
