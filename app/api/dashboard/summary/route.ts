import { NextRequest } from "next/server";
import { getUserIdOrThrow } from "@/lib/authUtils";
import { getDashboardSummary } from "@/lib/services/reports";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdOrThrow(req);
    const data = await getDashboardSummary(userId);
    return Response.json(data);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
