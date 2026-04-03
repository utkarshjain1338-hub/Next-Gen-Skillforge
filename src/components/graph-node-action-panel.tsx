"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Briefcase, ExternalLink, GraduationCap, Sparkles, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  freeLearningLinks,
  paidLearningLinks,
  profileQuickLinks,
  recruitingLinks,
  skillDocsLinks,
  type ActionNodeGroup,
} from "@/lib/graph-action-links";

export type GraphActionNode = {
  id: string;
  name: string;
  group: ActionNodeGroup;
  skillStatus?: "learning" | "verified";
};

type Props = {
  open: boolean;
  node: GraphActionNode | null;
  /** Viewport coordinates from the click (clientX / clientY) */
  anchor: { x: number; y: number };
  userDisplayName: string;
  onClose: () => void;
};

const PANEL_W = 320;
const PANEL_MAX_H = 0.78;

export function GraphNodeActionPanel({ open, node, anchor, userDisplayName, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const position = useMemo(() => {
    if (typeof window === "undefined") return { left: 16, top: 16 };
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxH = vh * PANEL_MAX_H;
    let left = anchor.x - PANEL_W / 2;
    let top = anchor.y + pad;
    left = Math.max(pad, Math.min(left, vw - PANEL_W - pad));
    if (top + maxH > vh - pad) {
      top = Math.max(pad, anchor.y - maxH - pad);
    }
    return { left, top };
  }, [anchor.x, anchor.y, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !node) return null;

  const title =
    node.group === "user"
      ? "Your profiles & platforms"
      : node.group === "job"
        ? "Find this role"
        : node.group === "gap"
          ? `Learn: ${node.name}`
          : node.skillStatus === "learning"
            ? `Skill (verifying): ${node.name}`
            : `Skill: ${node.name}`;

  const Icon =
    node.group === "user" ? User : node.group === "job" ? Briefcase : node.group === "gap" ? GraduationCap : Sparkles;

  const dotClass =
    node.group === "user"
      ? "bg-violet-500"
      : node.group === "job"
        ? "bg-blue-500"
        : node.group === "gap"
          ? "bg-red-500"
          : node.skillStatus === "learning"
            ? "bg-amber-500"
            : "bg-emerald-500";

  const borderAccent =
    node.group === "user"
      ? "border-l-violet-500"
      : node.group === "job"
        ? "border-l-blue-500"
        : node.group === "gap"
          ? "border-l-red-500"
          : node.skillStatus === "learning"
            ? "border-l-amber-500"
            : "border-l-emerald-500";

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 z-[60] cursor-default bg-black/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="pointer-events-auto fixed z-[80] flex max-h-[78vh] w-[min(100vw-1.5rem,320px)] flex-col overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-md"
        style={{ left: position.left, top: position.top }}
      >
        <div className={`flex items-start justify-between gap-2 border-b border-l-4 border-border px-3 py-2.5 pl-3 ${borderAccent}`}>
          <div className="flex min-w-0 items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick links</p>
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-sm [&_a]:pointer-events-auto [&_a]:relative [&_a]:z-10">
          {node.group === "user" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Open common career & coding profile destinations. Search uses “{userDisplayName || "You"}” where helpful.
              </p>
              {profileQuickLinks(userDisplayName || "developer").map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-foreground transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}

          {node.group === "job" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Major job boards pre-filled with this role title.</p>
              {recruitingLinks(node.name).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-foreground transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}

          {node.group === "skill" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Documentation and tutorials for a skill you already track.</p>
              {skillDocsLinks(node.name).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-foreground transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}

          {node.group === "gap" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Close this gap with paid courses or free resources and popular YouTube channels (search-assisted).
              </p>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Paid courses
                </p>
                <div className="space-y-2">
                  {paidLearningLinks(node.name).map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-foreground transition-colors hover:bg-amber-950/35"
                    >
                      <span className="min-w-0 truncate">{item.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Free learning
                </p>
                <div className="space-y-2">
                  {freeLearningLinks(node.name).map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg border border-emerald-900/35 bg-emerald-950/15 px-3 py-2 text-foreground transition-colors hover:bg-emerald-950/30"
                    >
                      <span className="min-w-0 truncate">{item.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
