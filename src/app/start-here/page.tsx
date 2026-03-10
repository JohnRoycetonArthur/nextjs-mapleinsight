import { redirect } from "next/navigation";

// The "Start Here" page is now the homepage at /.
// Redirect any direct visits to /start-here back to /.
export default function StartHereRedirect() {
  redirect("/");
}
