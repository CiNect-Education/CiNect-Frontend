"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { BackendType } from "@/types/domain";

export function DemoBackendBadge() {
  const [backend, setBackend] = useState<BackendType>("SPRING");

  useEffect(() => {
    const saved = localStorage.getItem("demo_backend") as BackendType;
    if (saved) setBackend(saved);
  }, []);

  function toggle() {
    const next: BackendType = backend === "SPRING" ? "NODE" : "SPRING";
    setBackend(next);
    localStorage.setItem("demo_backend", next);
  }

  return (
    <Badge
      variant="outline"
      className="cursor-pointer select-none border-primary/40 text-xs font-medium text-primary hover:bg-primary/10"
      onClick={toggle}
    >
      {backend}
    </Badge>
  );
}
