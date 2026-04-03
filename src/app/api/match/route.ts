import { NextRequest, NextResponse } from "next/server";
import { readGraph } from "@/lib/neo4j";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For testing purposes, if the frontend doesn't send data, we will default 
    // to starting with 'Python' and trying to reach 'Penetration Testing'
    const currentSkills = body.skills || ["Python"]; 
    const targetSkill = body.target || "Penetration Testing"; 

    // THE GRAPH ALGORITHM:
    // 1. Find the nodes the student already knows.
    // 2. Find the target node they want to reach.
    // 3. Calculate the shortest path bridging them using Prerequisites and Recommendations.
    const cypher = `
      MATCH (start:Skill) WHERE start.name IN $currentSkills
      MATCH (target:Skill {name: $targetSkill})
      MATCH path = shortestPath((start)-[:PREREQUISITE_FOR|RECOMMENDED_FOR*]->(target))
      RETURN [n IN nodes(path) | {name: n.name, category: n.category}] AS learningPath, 
             length(path) AS steps
      ORDER BY steps ASC
      LIMIT 1
    `;

    const result = await readGraph(cypher, { currentSkills, targetSkill });

    if (result.records.length === 0) {
      return NextResponse.json({ 
        message: "No direct learning path found in the current knowledge graph." 
      });
    }

    const bestPathNodes = result.records[0].get("learningPath");
    const stepsCount = result.records[0].get("steps").toNumber();

    // Filter out what the user already knows so we only show the "Gaps"
    const missingSkills = bestPathNodes
      .filter((node: any) => !currentSkills.includes(node.name))
      .map((node: any) => node.name);

    // Format the base analysis from Neo4j
    const gapAnalysis = {
      targetGoal: targetSkill,
      currentSkillsAnalyzed: currentSkills,
      totalStepsRequired: stepsCount,
      fullPath: bestPathNodes.map((n: any) => n.name).join(" ➔ "),
      gapsToLearn: missingSkills,
      syllabus: [] // We'll populate this next
    };

    

    // Return the combined Graph + AI payload to the React frontend
    return NextResponse.json(gapAnalysis);

  
    // ... rest of your catch block
  } catch (error) {
    console.error("Match Engine Graph Error:", error);
    return NextResponse.json(
      { error: "Failed to calculate dynamic path" },
      { status: 500 }
    );
  }
}