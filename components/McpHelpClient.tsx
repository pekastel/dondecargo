"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Globe,
  Key,
  Users,
  Link,
  Sparkles
} from "lucide-react";
import Image from "next/image";

export default function McpHelpClient() {
  const router = useRouter();

  const steps = [
    {
      number: 1,
      title: "Open Claude Code Settings",
      description: "Start by opening the Claude Code application and navigating to the settings menu.",
      image: "/mcp-help/step1.png",
      icon: Settings,
      details: "Launch Claude Code and look for the settings or configuration option. This is where you'll manage your MCP server connections."
    },
    {
      number: 2,
      title: "Navigate to MCP Servers",
      description: "Find and click on the MCP Servers section within the settings.",
      image: "/mcp-help/step2.png",
      icon: Globe,
      details: "Look for the MCP Servers tab or section. This is where you can add, edit, and manage your remote MCP server connections."
    },
    {
      number: 3,
      title: "Add New Server",
      description: "Click the 'Add Server' button to create a new remote MCP server configuration.",
      image: "/mcp-help/step3.png",
      icon: Users,
      details: "Select the option to add a new MCP server. You'll be presented with a form to configure the server details."
    },
    {
      number: 4,
      title: "Configure Server URL",
      description: "Enter your DondeCargo MCP server URL and authentication details.",
      image: "/mcp-help/step4.png",
      icon: Link,
      details: "This is the most important step. You need to replace the example URL with your actual deployment URL.",
      warning: true
    },
    {
      number: 5,
      title: "OAuth Authorization",
      description: "Complete the OAuth authorization flow to connect your Claude client to your DondeCargo.",
      image: "/mcp-help/step5.png",
      icon: Key,
      details: "After clicking 'Connect', you'll be redirected to your DondeCargo for authentication. Sign in with your credentials."
    },
    {
      number: 6,
      title: "Connected & Ready",
      description: "Your MCP server is now connected and all time tracking tools are available in Claude.",
      image: "/mcp-help/step6.png",
      icon: CheckCircle,
      details: "Once connected, you'll see all the available time tracking tools in Claude. You can now start managing your time tracking through natural language commands."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MCP Setup Guide
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Connect Your DondeCargo to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Claude
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Follow these step-by-step instructions to set up your DondeCargo MCP server with Claude. 
            The Model Context Protocol (MCP) is an open standard created by Anthropic that allows AI applications 
            to connect to tools and data. Once connected, you&apos;ll be able to manage your time tracking through natural language commands.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Learn More About Custom Connectors
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  For detailed information about custom connectors and remote MCP servers, visit{" "}
                  <a 
                    href="https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-medium"
                  >
                    Anthropic&apos;s official documentation
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {steps.map((step, index) => (
            <Card key={step.number} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2 shadow-lg">
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Step {step.number}
                        </Badge>
                        {step.warning && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Important
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mt-1">{step.title}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Content */}
                  <div className="space-y-4">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.details}
                    </p>

                    {/* Special Step 4 Instructions */}
                    {step.number === 4 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                              Important: Replace with Your URL
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              The URL shown in the image (<code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded text-xs">https://dondecargo-mcp.lumile.com.ar/</code>) is just an example. 
                              You must replace it with your actual deployment URL.
                            </p>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium text-yellow-800 dark:text-yellow-200">URL Pattern:</p>
                              <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-xs block">
                                https://[your-domain]/api/mcp
                              </code>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium text-yellow-800 dark:text-yellow-200">Examples:</p>
                              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                                <li><code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded text-xs">https://my-timetracker.vercel.app/api/mcp</code></li>
                                <li><code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded text-xs">https://timetracker.mycompany.com/api/mcp</code></li>
                                <li><code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded text-xs">https://my-app-name.onrender.com/api/mcp</code></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Special Step 5 Instructions */}
                    {step.number === 5 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                          <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="space-y-2">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                              OAuth Flow
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              After clicking &quot;Connect&quot;, Claude will redirect you to your DondeCargo deployment. 
                              Sign in with your credentials to authorize the connection.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Special Step 6 Instructions */}
                    {step.number === 6 && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="space-y-2">
                            <h4 className="font-semibold text-green-800 dark:text-green-200">
                              Available Tools
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                              Once connected, you&apos;ll have access to all time tracking tools:
                            </p>
                            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                              <li>• <strong>Client Management:</strong> create, list, update clients</li>
                              <li>• <strong>Project Management:</strong> create, list, update projects</li>
                              <li>• <strong>Reporting:</strong> get summaries, calculate earnings</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Image */}
                  <div className="relative">
                    <div className="relative w-full rounded-lg overflow-hidden shadow-lg border bg-gray-50 dark:bg-gray-900">
                      <Image
                        src={step.image}
                        alt={`Step ${step.number}: ${step.title}`}
                        width={800}
                        height={600}
                        className="object-contain w-full h-auto"
                        sizes="100vw"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Considerations */}
      <section className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl">Security & Privacy Considerations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                When connecting Claude to your DondeCargo MCP server, keep these security best practices in mind:
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Best Practices
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Only connect to trusted MCP servers</li>
                    <li>• Review OAuth permissions carefully during setup</li>
                    <li>• Monitor Claude&apos;s tool usage and outputs</li>
                    <li>• Use specific tools relevant to your conversation</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    Authentication
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• OAuth flow protects your credentials</li>
                    <li>• Claude never sees your actual password</li>
                    <li>• You can revoke access anytime in settings</li>
                    <li>• Permissions are limited to what you grant</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This DondeCargo MCP server only accesses your time tracking data and 
                  cannot perform destructive actions beyond what you explicitly authorize through the OAuth flow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Need Help?</h2>
                <p className="text-lg opacity-90">
                  If you encounter any issues during setup, check out our resources or get in touch.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    variant="secondary"
                    onClick={() => window.open('https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp', '_blank')}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Anthropic MCP Guide
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => window.open('https://github.com/lumile/timetracker-mcp', '_blank')}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GitHub Repository
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="border-white text-white bg-transparent hover:bg-white hover:text-blue-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}