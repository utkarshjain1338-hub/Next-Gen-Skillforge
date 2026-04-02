import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, steps } = await request.json();

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const savedPath = await db.learningPath.create({
    data: {
      userId: user.id,
      title: title,
      description: description,
      status: "active",
      steps: {
        create: steps.map((step: any, index: number) => ({
          title: step.focus,
          description: step.action_items.join(", "),
          order: index + 1,
          status: "pending"
        }))
      }
    }
  });

  return NextResponse.json(savedPath);
}