"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TracesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/settings?tab=traces"); }, [router]);
  return null;
}
