"use client";

import dynamic from "next/dynamic";
import type { ForceGraphMethods } from "react-force-graph-2d";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GraphNodeActionPanel } from "@/components/graph-node-action-panel";

/** Parse #RRGGBB to rgba() */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").slice(0, 6);
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawBloomDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  baseRadius: number,
  coreHex: string,
  layers: { radiusAdd: number; alpha: number }[],
) {
  for (const { radiusAdd, alpha } of layers) {
    ctx.beginPath();
    ctx.arc(x, y, baseRadius + radiusAdd, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(coreHex, alpha);
    ctx.fill();
  }
}

type SkillVerification = "none" | "learning" | "verified";

type UserSkill = {
  skill: string;
  confidence: number;
  source: string;
  verification?: SkillVerification;
};
type JobItem = {
  id: number;
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
};
type MatchRow = { title: string; matchScore: number; gaps: string[] };

type GraphNode = {
  id: string;
  name: string;
  group: "user" | "skill" | "job" | "gap";
  /** Only for group "skill" */
  skillStatus?: "learning" | "verified";
  fx?: number;
  fy?: number;
};

type GraphLink = { source: string; target: string };

const ForceGraph2D = dynamic(() => import("react-force-graph-2d").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(520px,70vh)] w-full items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
      Loading graph…
    </div>
  ),
});

const MAX_JOBS = 7;
const USER_PALETTE = "#a855f7";
const SKILL_PALETTE = "#22c55e";
const LEARNING_PALETTE = "#f59e0b";
const JOB_PALETTE = "#3b82f6";
const GAP_PALETTE = "#ef4444";
const LINK_DIM = "rgba(100, 116, 139, 0.14)";
const LINK_HOT = "rgba(56, 189, 248, 0.85)";
const PARTICLE_HOT = "rgba(165, 243, 252, 0.95)";
const PARTICLE_DIM = "rgba(148, 163, 184, 0.35)";

function slug(s: string) {
  return s.replace(/[^\w-]+/g, "_").slice(0, 64);
}

/** Base node body radius (graph coords); gap uses animated t to match the canvas. */
function getNodeBodyRadius(node: GraphNode, globalScale: number, timeSec: number): number {
  if (node.group === "user") return 14;
  if (node.group === "job") return 10;
  if (node.group === "skill") return 7;
  const pulse = 0.92 + 0.08 * Math.sin(timeSec * 5);
  return (5 + pulse * 1.2) / globalScale;
}

/** Max gap radius for stable hit-testing (matches worst-case pulse). */
function getNodeBodyRadiusMax(node: GraphNode, globalScale: number): number {
  if (node.group !== "gap") return getNodeBodyRadius(node, globalScale, 0);
  return (5 + 1.2) / globalScale;
}

export function SkillMatchForceGraph({
  userName,
  userSkills,
  jobs,
  matches,
}: {
  userName: string;
  userSkills: UserSkill[];
  jobs: JobItem[];
  matches: MatchRow[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const didZoomRef = useRef(false);
  const [dims, setDims] = useState({ w: 800, h: 520 });
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelNode, setPanelNode] = useState<GraphNode | null>(null);
  const [panelAnchor, setPanelAnchor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: Math.max(320, el.clientWidth), h: Math.min(560, Math.max(400, el.clientHeight)) });
    });
    ro.observe(el);
    setDims({ w: Math.max(320, el.clientWidth), h: Math.min(560, Math.max(400, el.clientHeight)) });
    return () => ro.disconnect();
  }, []);

  const topJobs = useMemo(() => {
    const byTitle = new Map(jobs.map((j) => [j.title, j]));
    if (matches.length > 0) {
      const ordered = [...matches].sort((a, b) => b.matchScore - a.matchScore);
      const out: JobItem[] = [];
      const seen = new Set<string>();
      for (const m of ordered) {
        const j = byTitle.get(m.title);
        if (j && !seen.has(j.title)) {
          seen.add(j.title);
          out.push(j);
          if (out.length >= MAX_JOBS) break;
        }
      }
      return out;
    }
    return jobs.slice(0, MAX_JOBS);
  }, [jobs, matches]);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const linkKeys = new Set<string>();
    const addLink = (source: string, target: string) => {
      const k = `${source}>${target}`;
      if (linkKeys.has(k)) return;
      linkKeys.add(k);
      links.push({ source, target });
    };
    const cx = dims.w / 2;
    const cy = dims.h / 2;

    const userId = "node-user";
    nodes.push({
      id: userId,
      name: userName || "You",
      group: "user",
      fx: cx,
      fy: cy,
    });

    const skillIds = new Map<string, string>();
    const rank = (s: "learning" | "verified" | undefined) => (s === "verified" ? 2 : s === "learning" ? 1 : 0);
    for (const us of userSkills) {
      const id = `skill-${slug(us.skill)}`;
      skillIds.set(us.skill.toLowerCase().trim(), id);
      const v = us.verification;
      const skillStatus: "learning" | "verified" | undefined =
        v === "learning" ? "learning" : v === "verified" ? "verified" : undefined;
      const i = nodes.findIndex((n) => n.id === id);
      if (i === -1) {
        nodes.push({ id, name: us.skill, group: "skill", skillStatus });
      } else {
        const prev = nodes[i]!.skillStatus;
        const next = rank(skillStatus) > rank(prev) ? skillStatus : prev;
        nodes[i]!.skillStatus = next;
      }
      addLink(userId, id);
    }

    const gapIds = new Map<string, string>();

    for (const job of topJobs) {
      const jobId = `job-${slug(job.title)}`;
      if (!nodes.some((n) => n.id === jobId)) {
        nodes.push({ id: jobId, name: job.title, group: "job" });
      }

      const pool = [...job.requiredSkills, ...job.preferredSkills];
      for (const skillName of pool) {
        const key = skillName.toLowerCase().trim();
        const sid = skillIds.get(key);
        if (sid) {
          addLink(sid, jobId);
        } else {
          let gid = gapIds.get(key);
          if (!gid) {
            gid = `gap-${slug(skillName)}`;
            gapIds.set(key, gid);
            nodes.push({ id: gid, name: skillName, group: "gap" });
          }
          addLink(jobId, gid);
        }
      }
    }

    return { nodes, links };
  }, [dims.w, dims.h, userName, userSkills, topJobs]);

  /** When non-null, only these node ids (hovered + neighbors) render at full fidelity; others dim. */
  const highlightSet = useMemo(() => {
    if (!hoverNodeId) return null;
    const set = new Set<string>([hoverNodeId]);
    for (const l of graphData.links) {
      const s = String(l.source);
      const t = String(l.target);
      if (s === hoverNodeId) set.add(t);
      if (t === hoverNodeId) set.add(s);
    }
    return set;
  }, [hoverNodeId, graphData.links]);

  useEffect(() => {
    didZoomRef.current = false;
  }, [graphData]);

  /** Spread nodes & lengthen links (d3-force under react-force-graph). */
  useEffect(() => {
    const run = () => {
      const fg = fgRef.current;
      if (!fg) return;
      try {
        const charge = fg.d3Force("charge") as { strength?: (n: number) => unknown } | undefined;
        if (charge?.strength) charge.strength(-560);
        const link = fg.d3Force("link") as { distance?: (d: number | (() => number)) => unknown } | undefined;
        if (link?.distance) link.distance(168);
        fg.d3ReheatSimulation();
      } catch {
        /* noop */
      }
    };
    const id = window.setTimeout(run, 0);
    const id2 = window.setTimeout(run, 120);
    return () => {
      clearTimeout(id);
      clearTimeout(id2);
    };
  }, [graphData.nodes.length, graphData.links.length, dims.w, dims.h]);

  const nodeColor = useCallback((n: GraphNode) => {
    switch (n.group) {
      case "user":
        return USER_PALETTE;
      case "skill":
        if (n.skillStatus === "learning") return LEARNING_PALETTE;
        return SKILL_PALETTE;
      case "job":
        return JOB_PALETTE;
      default:
        return GAP_PALETTE;
    }
  }, []);

  const nodeCanvasObject = useCallback(
    (node: GraphNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const t = Date.now() / 1000;
      const label = node.name;
      const fontSize = node.group === "user" ? 13 / globalScale : 11 / globalScale;
      ctx.font = `${node.group === "user" ? "700" : "600"} ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const r = getNodeBodyRadius(node, globalScale, t);

      if (node.x == null || node.y == null) return;

      const isHighlighted = !highlightSet || highlightSet.has(node.id);
      const isHover = hoverNodeId === node.id;
      const dimAlpha = isHighlighted ? 1 : 0.22;
      const scaleBoost = isHover ? 1.12 : 1;
      const rDraw = r * scaleBoost;

      const coreHex = node.group === "gap" ? GAP_PALETTE : nodeColor(node);

      ctx.save();
      ctx.globalAlpha = dimAlpha;

      if (node.group === "gap") {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        drawBloomDisc(ctx, node.x, node.y, rDraw, GAP_PALETTE, [
          { radiusAdd: 4 + pulse * 2, alpha: 0.035 },
          { radiusAdd: 1.5, alpha: 0.07 },
        ]);
        ctx.beginPath();
        ctx.arc(node.x, node.y, rDraw, 0, 2 * Math.PI);
        ctx.fillStyle = hexToRgba(GAP_PALETTE, 0.82);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, rDraw + 0.5, 0, 2 * Math.PI);
        ctx.strokeStyle = hexToRgba(GAP_PALETTE, 0.45);
        ctx.lineWidth = Math.max(0.75, 1 / globalScale);
        ctx.stroke();
      } else {
        const bloom =
          node.group === "user"
            ? [
                { radiusAdd: 26, alpha: 0.07 },
                { radiusAdd: 17, alpha: 0.12 },
                { radiusAdd: 10, alpha: 0.2 },
                { radiusAdd: 4, alpha: 0.38 },
              ]
            : node.group === "job"
              ? [
                  { radiusAdd: 20, alpha: 0.06 },
                  { radiusAdd: 12, alpha: 0.11 },
                  { radiusAdd: 6, alpha: 0.22 },
                  { radiusAdd: 2, alpha: 0.35 },
                ]
              : node.skillStatus === "learning"
                ? [
                    { radiusAdd: 22, alpha: 0.08 },
                    { radiusAdd: 14, alpha: 0.14 },
                    { radiusAdd: 7, alpha: 0.26 },
                    { radiusAdd: 2, alpha: 0.42 },
                  ]
                : [
                    { radiusAdd: 18, alpha: 0.05 },
                    { radiusAdd: 11, alpha: 0.1 },
                    { radiusAdd: 5, alpha: 0.2 },
                    { radiusAdd: 1, alpha: 0.33 },
                  ];

        drawBloomDisc(ctx, node.x, node.y, rDraw, coreHex, bloom);
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1.5, rDraw * 0.72), 0, 2 * Math.PI);
        ctx.fillStyle = hexToRgba("#ffffff", node.group === "user" ? 0.22 : 0.14);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, rDraw, 0, 2 * Math.PI);
        ctx.fillStyle = hexToRgba(coreHex, 0.95);
        ctx.fill();
      }

      const labelAlpha = isHighlighted ? 0.95 : 0.35;
      const maxChars = node.group === "job" ? 22 : 18;
      const text = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
      const ty = node.y + rDraw + fontSize * 1.15;
      if (node.group === "gap") {
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.lineWidth = Math.max(2.2, 3 / globalScale);
        ctx.strokeStyle = `rgba(15, 23, 42, ${0.88 * dimAlpha})`;
        ctx.strokeText(text, node.x, ty);
        ctx.fillStyle = `rgba(254, 226, 226, ${labelAlpha})`;
      } else {
        ctx.fillStyle = `rgba(248, 250, 252, ${labelAlpha})`;
      }
      ctx.fillText(text, node.x, ty);

      ctx.restore();
    },
    [nodeColor, highlightSet, hoverNodeId]
  );

  const linkColor = useCallback(
    (link: object) => {
      const l = link as { source: unknown; target: unknown };
      const sid = String((l.source as { id?: string })?.id ?? l.source);
      const tid = String((l.target as { id?: string })?.id ?? l.target);
      if (!highlightSet) return "rgba(125, 211, 252, 0.35)";
      if (highlightSet.has(sid) && highlightSet.has(tid)) return LINK_HOT;
      return LINK_DIM;
    },
    [highlightSet],
  );

  const linkWidth = useCallback(
    (link: object) => {
      const l = link as { source: unknown; target: unknown };
      const sid = String((l.source as { id?: string })?.id ?? l.source);
      const tid = String((l.target as { id?: string })?.id ?? l.target);
      if (!highlightSet) return 1.15;
      if (highlightSet.has(sid) && highlightSet.has(tid)) return 2.6;
      return 0.65;
    },
    [highlightSet],
  );

  const linkDirectionalParticles = useCallback(
    (link: object) => {
      const l = link as { source: unknown; target: unknown };
      const sid = String((l.source as { id?: string })?.id ?? l.source);
      const tid = String((l.target as { id?: string })?.id ?? l.target);
      if (!highlightSet) return 3;
      if (highlightSet.has(sid) && highlightSet.has(tid)) return 5;
      return 1;
    },
    [highlightSet],
  );

  const linkDirectionalParticleColor = useCallback(
    (link: object) => {
      const l = link as { source: unknown; target: unknown };
      const sid = String((l.source as { id?: string })?.id ?? l.source);
      const tid = String((l.target as { id?: string })?.id ?? l.target);
      if (!highlightSet) return PARTICLE_HOT;
      if (highlightSet.has(sid) && highlightSet.has(tid)) return PARTICLE_HOT;
      return PARTICLE_DIM;
    },
    [highlightSet],
  );

  const onNodeHover = useCallback((n: GraphNode | null) => {
    setHoverNodeId(n ? String(n.id) : null);
  }, []);

  const onNodeClick = useCallback((node: object, event: MouseEvent) => {
    const n = node as GraphNode;
    const ev = event;
    setPanelNode({
      id: String(n.id),
      name: n.name,
      group: n.group,
      skillStatus: n.skillStatus,
    });
    const x = ev?.clientX ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
    const y = ev?.clientY ?? (typeof window !== "undefined" ? window.innerHeight / 3 : 0);
    setPanelAnchor({ x, y });
    setPanelOpen(true);
  }, []);

  /**
   * Required when using nodeCanvasObject replace mode: paints pick-buffer shapes for hit-testing.
   * Without this, clicks/hover on custom-drawn nodes do not register.
   */
  const nodePointerAreaPaint = useCallback(
    (node: GraphNode, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x == null || node.y == null) return;
      const r = getNodeBodyRadiusMax(node, globalScale);
      const fontSize = node.group === "user" ? 13 / globalScale : 11 / globalScale;
      const bloomPad =
        node.group === "user" ? 34 : node.group === "job" ? 26 : node.group === "skill" ? 22 : 16;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 1.12 + bloomPad, 0, Math.PI * 2);
      ctx.fill();
      const halfW = Math.max(72, 118 / Math.max(0.45, globalScale));
      const labelTop = node.y + r * 1.12 + 2;
      const labelH = fontSize * 2.5 + 14;
      ctx.fillRect(node.x - halfW, labelTop, halfW * 2, labelH);
    },
    [],
  );

  if (userSkills.length === 0) {
    return (
      <div className="flex h-[min(520px,70vh)] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Add skills to explore your live Neo4j career graph: you at the center, green skills, blue target roles, and pulsing red gaps.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-border bg-[#060b14] dark:bg-[#020617]"
      style={{
        boxShadow: "inset 0 0 80px rgba(56, 189, 248, 0.04)",
      }}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-3 rounded-md border border-border/60 bg-background/90 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: USER_PALETTE }} />
          You
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: SKILL_PALETTE }} />
          Verified
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEARNING_PALETTE }} />
          Verifying
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: JOB_PALETTE }} />
          Jobs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          Skill gaps
        </span>
        <span className="w-full basis-full text-[9px] font-normal normal-case tracking-normal text-sky-300/80 sm:basis-auto sm:w-auto">
          Hover: neon focus · Click: quick links (jobs, profiles, learning)
        </span>
      </div>
      <ForceGraph2D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={graphData}
        backgroundColor="rgba(6, 11, 20, 0.96)"
        autoPauseRedraw={false}
        nodeRelSize={4}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkCurvature={0.08}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleSpeed={0.012}
        linkDirectionalParticleWidth={2.4}
        linkDirectionalParticleColor={linkDirectionalParticleColor}
        nodeVal={(n: GraphNode) => (n.group === "user" ? 22 : n.group === "job" ? 16 : 12)}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.35}
        onNodeHover={onNodeHover}
        onNodeClick={onNodeClick}
        showPointerCursor
        onEngineStop={() => {
          if (!didZoomRef.current) {
            didZoomRef.current = true;
            fgRef.current?.zoomToFit(400, 80);
          }
        }}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
      />
      <GraphNodeActionPanel
        open={panelOpen}
        node={panelNode}
        anchor={panelAnchor}
        userDisplayName={userName}
        onClose={() => {
          setPanelOpen(false);
          setPanelNode(null);
        }}
      />
    </div>
  );
}
