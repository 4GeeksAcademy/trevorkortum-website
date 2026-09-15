import { redirect } from "next/navigation";

/** Default entry → ingredients list (protected by AuthShell). */
export default function HomePage() {
  redirect("/backoffice/inventory/products");
}
