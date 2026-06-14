import { notFound } from "next/navigation";
import { RawMaterialsE2EHarness } from "./raw-materials-e2e-harness";

export const dynamic = "force-dynamic";

export default function RawMaterialsE2EPage() {
  if (process.env.FORMULIA_E2E_AUTH_BYPASS !== "1") {
    notFound();
  }

  return <RawMaterialsE2EHarness />;
}
