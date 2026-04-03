/**
 * Rapid technical interview bank + lightweight answer grading (no external API).
 * Used by the Socket.IO interview server.
 */

export type InterviewQuestion = {
  id: string;
  prompt: string;
  keywords: string[];
  /** Minimum keyword hits (after normalization) to count as correct */
  minHits: number;
};

const GENERIC: InterviewQuestion[] = [
  {
    id: "g1",
    prompt: "In one sentence: what is this technology primarily used for in modern software teams?",
    keywords: ["build", "develop", "deploy", "run", "manage", "automate", "scale", "application", "software", "system", "cloud", "data", "code"],
    minHits: 2,
  },
  {
    id: "g2",
    prompt: "Name one common pain point teams solve using this skill.",
    keywords: ["bug", "slow", "security", "scale", "maintain", "test", "integrate", "deploy", "cost", "reliability", "complexity"],
    minHits: 1,
  },
  {
    id: "g3",
    prompt: "What would you check first when something breaks in a production system related to this area?",
    keywords: ["log", "metric", "monitor", "alert", "trace", "error", "config", "version", "rollback", "health", "dashboard"],
    minHits: 1,
  },
];

const BY_SKILL: Record<string, InterviewQuestion[]> = {
  Docker: [
    {
      id: "d1",
      prompt: "What is a Docker image vs a container—in one short phrase each?",
      keywords: ["image", "container", "template", "snapshot", "filesystem", "running", "instance", "layer"],
      minHits: 2,
    },
    {
      id: "d2",
      prompt: "Name a Dockerfile instruction that sets the base OS or runtime.",
      keywords: ["from", "base"],
      minHits: 1,
    },
    {
      id: "d3",
      prompt: "Why do teams use multi-stage builds?",
      keywords: ["smaller", "size", "security", "artifact", "production", "stage", "final", "image"],
      minHits: 2,
    },
  ],
  AWS: [
    {
      id: "a1",
      prompt: "What does IAM help you control in AWS?",
      keywords: ["access", "permission", "identity", "user", "role", "policy", "auth"],
      minHits: 2,
    },
    {
      id: "a2",
      prompt: "Name one AWS service used for object storage.",
      keywords: ["s3", "simple storage", "bucket"],
      minHits: 1,
    },
    {
      id: "a3",
      prompt: "What is an Availability Zone in plain terms?",
      keywords: ["datacenter", "region", "isolated", "fault", "redundancy", "independent"],
      minHits: 2,
    },
  ],
  TypeScript: [
    {
      id: "t1",
      prompt: "What does TypeScript add on top of JavaScript?",
      keywords: ["type", "static", "typing", "compile", "safety", "interface"],
      minHits: 2,
    },
    {
      id: "t2",
      prompt: "What file extension is typical for TypeScript source?",
      keywords: [".ts", "ts", "tsx"],
      minHits: 1,
    },
    {
      id: "t3",
      prompt: "What is a generic used for in TypeScript?",
      keywords: ["reuse", "type", "parameter", "safe", "function", "class", "array"],
      minHits: 2,
    },
  ],
  React: [
    {
      id: "r1",
      prompt: "What is a React component?",
      keywords: ["ui", "function", "class", "reuse", "props", "state", "render", "interface"],
      minHits: 2,
    },
    {
      id: "r2",
      prompt: "What hook stores mutable UI state in a function component?",
      keywords: ["usestate", "use state", "state"],
      minHits: 1,
    },
    {
      id: "r3",
      prompt: "What problem does the virtual DOM help address?",
      keywords: ["performance", "update", "diff", "efficient", "re-render", "browser"],
      minHits: 2,
    },
  ],
  JavaScript: [
    {
      id: "j1",
      prompt: "What is the difference between `let` and `const`?",
      keywords: ["reassign", "mutable", "immutable", "block", "scope"],
      minHits: 2,
    },
    {
      id: "j2",
      prompt: "What is a Promise used for?",
      keywords: ["async", "future", "then", "await", "callback", "network"],
      minHits: 2,
    },
    {
      id: "j3",
      prompt: "What does `===` compare that `==` does not always respect?",
      keywords: ["type", "strict", "equality", "coercion"],
      minHits: 2,
    },
  ],
  "Node.js": [
    {
      id: "n1",
      prompt: "What runtime executes JavaScript on the server in the Node ecosystem?",
      keywords: ["v8", "javascript", "runtime", "chrome", "engine"],
      minHits: 2,
    },
    {
      id: "n2",
      prompt: "What is `npm` primarily used for?",
      keywords: ["package", "install", "dependency", "publish", "registry"],
      minHits: 2,
    },
    {
      id: "n3",
      prompt: "What built-in module is often used to spin up an HTTP server?",
      keywords: ["http", "https", "createServer", "server"],
      minHits: 1,
    },
  ],
  Python: [
    {
      id: "p1",
      prompt: "What is a virtual environment used for in Python projects?",
      keywords: ["isolate", "dependency", "version", "package", "venv", "pip"],
      minHits: 2,
    },
    {
      id: "p2",
      prompt: "What keyword defines a function in Python?",
      keywords: ["def", "define", "function"],
      minHits: 1,
    },
    {
      id: "p3",
      prompt: "What is PEP 8 related to?",
      keywords: ["style", "format", "convention", "readability", "lint"],
      minHits: 1,
    },
  ],
  SQL: [
    {
      id: "s1",
      prompt: "What does `SELECT` do in SQL?",
      keywords: ["query", "read", "retrieve", "fetch", "rows", "data", "columns"],
      minHits: 2,
    },
    {
      id: "s2",
      prompt: "What is a primary key?",
      keywords: ["unique", "identify", "row", "record", "table", "constraint"],
      minHits: 2,
    },
    {
      id: "s3",
      prompt: "What does `JOIN` combine?",
      keywords: ["table", "rows", "related", "foreign", "key", "relationship"],
      minHits: 2,
    },
  ],
  Git: [
    {
      id: "git1",
      prompt: "What does `git commit` record?",
      keywords: ["snapshot", "change", "history", "repository", "version", "save"],
      minHits: 2,
    },
    {
      id: "git2",
      prompt: "What is a branch used for?",
      keywords: ["parallel", "feature", "isolate", "merge", "work", "develop"],
      minHits: 2,
    },
    {
      id: "git3",
      prompt: "What command integrates another branch into your current branch?",
      keywords: ["merge", "rebase", "pull"],
      minHits: 1,
    },
  ],
};

const TOTAL_ROUNDS = 5;
const REQUIRED_CORRECT = 4;

export function buildInterviewPlan(skillName: string): InterviewQuestion[] {
  const key = Object.keys(BY_SKILL).find((k) => k.toLowerCase() === skillName.trim().toLowerCase());
  const specific = key ? BY_SKILL[key]! : [];
  const pool = [...specific, ...GENERIC];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TOTAL_ROUNDS);
}

export function gradeAnswer(question: InterviewQuestion, rawAnswer: string): boolean {
  const a = rawAnswer.toLowerCase().replace(/[^a-z0-9\s.#+]/g, " ");
  const tokens = new Set(a.split(/\s+/).filter((w) => w.length > 1));
  let hits = 0;
  for (const kw of question.keywords) {
    const k = kw.toLowerCase();
    if (k.includes(" ")) {
      if (a.includes(k)) hits++;
    } else if (tokens.has(k) || a.includes(k)) hits++;
  }
  return hits >= question.minHits;
}

export function roundsConfig() {
  return { total: TOTAL_ROUNDS, requiredCorrect: REQUIRED_CORRECT };
}
