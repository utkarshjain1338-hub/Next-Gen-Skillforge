import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

type UserSkillInput = { name: string; confidence?: number };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userSkillNames = Array.isArray(body.userSkillNames) ? body.userSkillNames : [];

    const userNames = new Set(
      userSkillNames
        .map((u: UserSkillInput) => (typeof u.name === "string" ? u.name.toLowerCase().trim() : ""))
        .filter(Boolean)
    );

    const records = await runQuery(
      `
      MATCH (j:Job)
      OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(rs:Skill)
      WITH j, collect(DISTINCT rs.name) AS reqNames
      OPTIONAL MATCH (j)-[:PREFERS_SKILL]->(ps:Skill)
      WITH j, reqNames, collect(DISTINCT ps.name) AS prefNames
      RETURN j.title AS title,
        [x IN reqNames WHERE x IS NOT NULL | x] AS required,
        [x IN prefNames WHERE x IS NOT NULL | x] AS preferred
      `
    );

    const matches = records.map((rec) => {
      const title = rec.get("title") as string;
      const required = (rec.get("required") as string[]).filter(Boolean);
      const preferred = (rec.get("preferred") as string[]).filter(Boolean);

      const reqMatch = required.filter((s) => userNames.has(s.toLowerCase().trim())).length;
      const reqScore = required.length > 0 ? (reqMatch / required.length) * 70 : 0;

      const prefMatch = preferred.filter((s) => userNames.has(s.toLowerCase().trim())).length;
      const prefScore = preferred.length > 0 ? (prefMatch / preferred.length) * 30 : 0;

      const matchScore = Math.min(100, Math.round(reqScore + prefScore));

      const gaps = required
        .filter((s) => !userNames.has(s.toLowerCase().trim()))
        .map((skillName) => ({ skillName }));

      return {
        job: { title },
        matchScore,
        gaps,
      };
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ matches });
  } catch (e) {
    console.error("graph-match:", e);
    return NextResponse.json({ matches: [] });
  }
}
