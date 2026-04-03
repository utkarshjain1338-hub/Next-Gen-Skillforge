import { NextResponse } from "next/server";
import { writeGraph } from "@/lib/neo4j";

export async function GET() {
  const seedQuery = `
    // 1. Create Core Programming & CS Nodes
    MERGE (cpp:Skill {id: 'skill_cpp', name: 'C++', category: 'Programming'})
    MERGE (python:Skill {id: 'skill_py', name: 'Python', category: 'Programming'})
    MERGE (dsa:Skill {id: 'skill_dsa', name: 'Data Structures & Algorithms', category: 'Computer Science'})
    
    // 2. Create OS & Environment Nodes
    MERGE (linux:Skill {id: 'skill_linux', name: 'Linux OS', category: 'Operating System'})
    MERGE (arch:Skill {id: 'skill_arch', name: 'Arch Linux', category: 'Operating System'})
    MERGE (parrot:Skill {id: 'skill_parrot', name: 'Parrot OS', category: 'Operating System'})
    
    // 3. Create Security & Networking Nodes
    MERGE (network:Skill {id: 'skill_net', name: 'Networking', category: 'Infrastructure'})
    MERGE (cyber:Skill {id: 'skill_cyber', name: 'Cybersecurity Fundamentals', category: 'Security'})
    MERGE (pentest:Skill {id: 'skill_pentest', name: 'Penetration Testing', category: 'Security'})

    // 4. Map Prerequisite Relationships (The Learning Path)
    MERGE (cpp)-[:PREREQUISITE_FOR {weight: 1.0}]->(dsa)
    MERGE (python)-[:PREREQUISITE_FOR {weight: 1.0}]->(dsa)
    
    MERGE (linux)-[:PREREQUISITE_FOR {weight: 1.0}]->(arch)
    MERGE (linux)-[:PREREQUISITE_FOR {weight: 1.0}]->(parrot)
    MERGE (linux)-[:PREREQUISITE_FOR {weight: 0.8}]->(cyber)
    
    MERGE (network)-[:PREREQUISITE_FOR {weight: 1.0}]->(cyber)
    MERGE (cyber)-[:PREREQUISITE_FOR {weight: 1.0}]->(pentest)

    // 5. Map Recommendation Relationships
    MERGE (parrot)-[:RECOMMENDED_FOR {weight: 0.9}]->(pentest)
    MERGE (python)-[:RECOMMENDED_FOR {weight: 0.7}]->(cyber)
  `;

  try {
    await writeGraph(seedQuery);
    
    return NextResponse.json({ 
      success: true, 
      message: "Knowledge Graph successfully seeded in Neo4j AuraDB!" 
    });
  } catch (error) {
    console.error("Failed to seed graph:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to seed graph database.",
        // This line exposes the exact error from the driver
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}