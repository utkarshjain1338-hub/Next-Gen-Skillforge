import neo4j, { Driver } from "neo4j-driver";

// Ensure we only create one instance of the driver (singleton pattern)
let driver: Driver | undefined;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "skillforge123";

    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
      console.log("🟢 Successfully initialized Neo4j Driver");
    } catch (error) {
      console.error("🔴 Failed to initialize Neo4j Driver:", error);
      throw error;
    }
  }
  return driver;
}

// Utility function to make querying easier and automatically close the session
export async function readGraph(cypher: string, params: Record<string, any> = {}) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result;
  } finally {
    await session.close();
  }
}

export async function writeGraph(cypher: string, params: Record<string, any> = {}) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.executeWrite((tx) => tx.run(cypher, params));
    return result;
  } finally {
    await session.close();
  }
}