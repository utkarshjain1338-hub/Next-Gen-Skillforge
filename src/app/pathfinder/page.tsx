"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Target, ArrowRight, Clock, BookOpen, Sparkles, ArrowLeft } from "lucide-react";

export default function PathfinderPage() {
  const [currentSkills, setCurrentSkills] = useState("Python, Linux, Parrot OS, Japanese");
  const [targetRole, setTargetRole] = useState("Penetration Testing");
  
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [isSyllabusLoading, setIsSyllabusLoading] = useState(false);
  const [pathData, setPathData] = useState<any>(null);
  const [syllabusData, setSyllabusData] = useState<any>(null);

  const generatePath = async () => {
    setIsGraphLoading(true);
    setPathData(null);
    setSyllabusData(null);

    try {
      const skillsArray = currentSkills.split(",").map(s => s.trim()).filter(Boolean);

      const graphResponse = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: skillsArray, target: targetRole }),
      });

      if (graphResponse.ok) {
        const graphData = await graphResponse.json();
        setPathData(graphData);
        setIsGraphLoading(false);

        if (graphData.gapsToLearn && graphData.gapsToLearn.length > 0) {
          setIsSyllabusLoading(true);
          try {
            const aiResponse = await fetch("http://127.0.0.1:8000/generate-syllabus", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                target_role: targetRole,
                current_skills: skillsArray,
                gaps_to_learn: graphData.gapsToLearn
              }),
            });
            
            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              setSyllabusData(aiData.syllabus);
              // --- PERSISTENCE: Save the generated path to Prisma ---
            if (aiData.syllabus && aiData.syllabus.length > 0) {
              try {
                await fetch("/api/save-path", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: `Path to ${targetRole}`,
                    description: `AI-generated roadmap for ${targetRole} starting from ${currentSkills}`,
                    steps: aiData.syllabus, // This matches the Prisma 'steps' creation logic
                  }),
                });
                console.log("Learning path persisted to database successfully.");
              } catch (saveErr) {
                console.error("Failed to persist learning path:", saveErr);
              }
            }
            }
          } catch (aiErr) {
            console.error("AI Engine failed", aiErr);
          } finally {
            setIsSyllabusLoading(false);
          }
        }
      }
    } catch (error) {
      console.error("Error generating path:", error);
      setIsGraphLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simplified Global Navigation Bar */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">NXT-GEN SKILLFORGE</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container mx-auto p-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <BrainCircuit className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI Learning Pathfinder</h1>
        </div>

        {/* --- The Input Section --- */}
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle>Define Your Trajectory</CardTitle>
            <CardDescription>Enter your current toolkit and where you want to go. The AI will map the shortest route.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Current Skills (comma separated)</label>
              <Input 
                value={currentSkills} 
                onChange={(e) => setCurrentSkills(e.target.value)} 
                placeholder="e.g., React, Node.js, Python"
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Target Role or Skill</label>
              <Input 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)} 
                placeholder="e.g., Cloud Architect"
              />
            </div>
            <Button 
              onClick={generatePath} 
              disabled={isGraphLoading || !currentSkills || !targetRole}
              className="w-full md:w-auto"
            >
              {isGraphLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Calculating Path...
                </>
              ) : (
                "Generate Syllabus"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* --- The Results Section --- */}
        {pathData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {pathData.message || pathData.error ? (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardHeader>
                  <CardTitle className="text-destructive">Dead End</CardTitle>
                  <CardDescription>{pathData.message || pathData.error || "Try adjusting your target role or current skills."}</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                {/* Graph Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" /> 
                      Knowledge Graph Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 text-lg font-medium">
                      {pathData.fullPath && pathData.fullPath.split(" ➔ ").map((node: string, index: number, arr: string[]) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className={pathData.gapsToLearn?.includes(node) ? "text-primary font-bold" : "text-muted-foreground"}>
                            {node}
                          </span>
                          {index < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Badge variant="secondary">Total Steps: {pathData.totalStepsRequired}</Badge>
                      <Badge variant="outline">{pathData.gapsToLearn?.length || 0} Gaps Identified</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Syllabus Timeline */}
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    Personalized Action Plan
                  </h2>
                  
                  {isSyllabusLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse border-2 border-dashed rounded-lg border-primary/20 bg-muted/10">
                      <BrainCircuit className="w-12 h-12 mb-4 animate-bounce text-primary" />
                      <p>Llama 3.2 is writing your custom syllabus...</p>
                      <p className="text-xs opacity-50 mt-2">(This takes a few seconds on local hardware)</p>
                    </div>
                  ) : syllabusData && syllabusData.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {syllabusData.map((week: any) => (
                        <Card key={week.week} className="relative overflow-hidden border-l-4 border-l-primary hover:border-l-primary/80 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <Badge>Week {week.week}</Badge>
                              <span className="text-xs flex items-center gap-1 text-muted-foreground font-medium">
                                <Clock className="w-3 h-3" />
                                {week.estimated_hours} hrs
                              </span>
                            </div>
                            <CardTitle className="text-lg mt-2">{week.focus}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {week.action_items.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}