"use client";

import { useEffect, useState } from "react";

// Demo progress for one sample project, kept in this browser tab only (sessionStorage). Nothing reaches a server.
export type DemoStep = "quotes" | "accepted" | "delivered" | "confirmed" | "reviewed";
export type DemoJob = { provider: string; price: number; step: DemoStep; stars?: number; review?: string };

const KEY = "piron-demo";

function readAll(): Record<string, DemoJob> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Record<string, DemoJob>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DemoJob>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // private mode or blocked storage: the demo still works for this render
  }
  window.dispatchEvent(new Event("piron-demo-change"));
}

/** The demo job for a project, with setters. `ready` is false during the first server render. */
export function useDemoJob(projectId: string) {
  const [job, setJobState] = useState<DemoJob | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => {
      setJobState(readAll()[projectId] ?? null);
      setReady(true);
    };
    load();
    window.addEventListener("piron-demo-change", load);
    return () => window.removeEventListener("piron-demo-change", load);
  }, [projectId]);

  const setJob = (next: DemoJob | null) => {
    const all = readAll();
    if (next) all[projectId] = next;
    else delete all[projectId];
    writeAll(all);
  };
  return { job, ready, setJob };
}

/** Every demo job in this tab (for the dashboard). */
export function useDemoJobs() {
  const [jobs, setJobs] = useState<Record<string, DemoJob>>({});
  useEffect(() => {
    const load = () => setJobs(readAll());
    load();
    window.addEventListener("piron-demo-change", load);
    return () => window.removeEventListener("piron-demo-change", load);
  }, []);
  return jobs;
}
