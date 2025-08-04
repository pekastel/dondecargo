import { NextRequest } from "next/server";
import { getUserIdOrThrow } from "@/lib/authUtils";
import { db } from "@/drizzle/connection";
import { timeEntries, user } from "@/drizzle/schema";
import { sql, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getUserIdOrThrow(req);
    
    // Get all unique user IDs from time entries with user info from Better Auth
    const users = await db
      .select({
        userId: timeEntries.userId,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        entryCount: sql<number>`count(*)`,
      })
      .from(timeEntries)
      .leftJoin(user, eq(timeEntries.userId, user.id))
      .groupBy(timeEntries.userId, user.name, user.email, user.image)
      .orderBy(timeEntries.userId);

    // Convert to more user-friendly format
    const formattedUsers = users.map(user => ({
      id: user.userId,
      name: user.userName || getUserDisplayName(user.userId, currentUserId),
      email: user.userEmail || getUserEmail(user.userId, currentUserId),
      image: user.userImage || getUserImage(user.userId, currentUserId),
      entryCount: user.entryCount,
    }));

    return Response.json(formattedUsers);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Helper functions to get user display names and emails
// In a real app, you'd query the Better Auth user table
function getUserDisplayName(userId: string, currentUserId: string): string {
  // Show "You" for current user
  if (userId === currentUserId) {
    return "You";
  }
  
  const userMap: Record<string, string> = {
    'test-user-123': 'Alice Johnson',
    'test-user-456': 'Bob Smith', 
    'test-user-789': 'Carol Davis',
    'test-user-012': 'David Wilson',
  };
  
  // For unknown users, show first 8 characters of ID
  return userMap[userId] || `User ${userId.slice(0, 8)}`;
}

function getUserEmail(userId: string, currentUserId: string): string {
  // Show placeholder for current user
  if (userId === currentUserId) {
    return "your-email@example.com";
  }
  
  const emailMap: Record<string, string> = {
    'test-user-123': 'alice@example.com',
    'test-user-456': 'bob@example.com',
    'test-user-789': 'carol@example.com', 
    'test-user-012': 'david@example.com',
  };
  
  return emailMap[userId] || `${userId.slice(0, 8)}@example.com`;
}

function getUserImage(userId: string, _currentUserId: string): string | null {
  // For demo purposes, return some placeholder images
  const imageMap: Record<string, string> = {
    'test-user-123': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    'test-user-456': 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
    'test-user-789': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    'test-user-012': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  };
  
  return imageMap[userId] || null;
}