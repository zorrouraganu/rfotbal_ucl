import { redirect } from "next/navigation";
export default function AdminLoginRedirect() { redirect("/login?returnTo=/admin"); }
