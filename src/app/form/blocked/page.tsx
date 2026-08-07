import { redirect } from "next/navigation";

/** Legacy route — form blocking was removed in favour of HR alerts only. */
export default function BlockedPage() {
  redirect("/form");
}
