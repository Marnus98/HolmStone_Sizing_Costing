"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** Solar/Battery/Off-Grid Sizing were consolidated into one always-on-screen
 *  page per the user's request - no more switching tabs to compare system
 *  types. This route now just redirects there. */
export default function SolarSizingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sizing");
  }, [router]);
  return (
    <div className="p-8 text-sm text-slate-500">
      Solar Sizing has moved - redirecting to{" "}
      <Link href="/sizing" className="text-blue-600 underline">System Sizing</Link>...
    </div>
  );
}
