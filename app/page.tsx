"use client";

import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Timer, 
  Github, 
  MessageSquare, 
  Clock, 
  Users, 
  BarChart3, 
  Zap,
  Globe,
  Sparkles,
  ArrowRight,
  BookOpen,
  Cloud,
  Star,
  Shield,
  Headphones,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 md:p-2 shadow-lg">
                <Timer className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <span className="sm:hidden">DondeCargo</span>
                <span className="hidden sm:inline">DondeCargo MCP</span>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {session ? (
                <Button 
                  onClick={() => router.push("/dashboard")}
                  size="sm"
                  className="md:size-default"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push("/login")}
                  size="sm"
                  className="md:size-default"
                >
                  Sign In
                </Button>
              )}
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Powered by Model Context Protocol (MCP)
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Conversational
            </span>
            <br />
            DondeCargo Time Tracking
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Skip complex screens and track your work with natural language. A collaborative platform where 
            teams share clients and projects while maintaining individual time tracking privacy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/mcp-help")}
                  className="px-8 py-3 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  MCP Setup Guide
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  Sign In
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/mcp-help")}
                  className="px-8 py-3 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  MCP Setup Guide
                </Button>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-4 opacity-70">
            Need help connecting to Claude? Check our setup guide above
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Why DondeCargo MCP?</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            DondeCargo MCP implements a <strong>conversational-first architecture</strong> that fundamentally reimagines software interaction patterns. Instead of adapting users to interface constraints, the system adapts to natural language expression.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Key Architectural Principles</h3>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-medium">Conversational Primary Interface</span>
                </div>
                <p className="text-sm text-muted-foreground ml-4">
                  All core functionality accessible through natural language commands via MCP protocol
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="font-medium">Extensible Intent System</span>
                </div>
                <p className="text-sm text-muted-foreground ml-4">
                  New capabilities added through MCP tools without UI redesign
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 max-w-3xl mx-auto">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              Interface Hierarchy
            </h4>
            <div className="text-sm text-muted-foreground space-y-2 text-left">
              <p><strong>1. Primary Interface (MCP Protocol):</strong> Complete functionality accessible through natural language commands in any MCP-compatible client</p>
              <p><strong>2. Secondary Interface (Web Dashboard):</strong> Optional visualization layer for data consultation, basic timer operations, and report generation</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>MCP-Powered Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All functionality implemented via MCP tools. Create clients, track time, generate reports - all through natural conversation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Shared clients and projects across the team, while individual time entries remain completely private. No ownership barriers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Rich Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get daily, weekly and custom summaries. Track productivity and analyze your time patterns effortlessly.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>MCP-First Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Complete functionality through MCP conversation. Dashboard serves as visual supplement for charts and basic operations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle>Data Integrity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Clients and projects with tracked time cannot be deactivated. Automatic safeguards prevent data loss and preserve history.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Globe className="h-12 w-12 text-teal-600 mb-4" />
              <CardTitle>Dashboard as Supplement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Web interface provides charts, visual reports, and basic timer controls. Full productivity lives in MCP conversation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Built with Modern Tech</h2>
            <p className="text-xl text-muted-foreground">
              Leveraging the latest technologies for optimal performance and developer experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Next.js 15", desc: "App Router & TypeScript" },
              { name: "Better Auth", desc: "Enhanced PKCE & OAuth" },
              { name: "PostgreSQL", desc: "Reliable data storage" },
              { name: "MCP Protocol", desc: "Conversational interface" },
              { name: "Loops.js", desc: "Email verification (optional)", optional: true },
              { name: "Redis", desc: "Session cache (optional)", optional: true }
            ].map((tech, i) => (
              <Card key={i} className="text-center border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{tech.name}</h3>
                    {tech.optional && (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{tech.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your DondeCargo Time Tracking?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join developers and teams who&apos;ve simplified their workflow with conversational time tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100"
                >
                  Sign In
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('https://github.com/lumile/dondecargo-v2', '_blank')}
                className="px-8 py-3 border-white text-white bg-transparent hover:bg-white hover:text-blue-600"
              >
                <Github className="h-5 w-5 mr-2" />
                View on GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
