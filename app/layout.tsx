import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import { Github, Star, Timer, Home, BarChart3, LogIn } from "lucide-react";
import { FooterLink } from "@/components/footer-link";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "DondeCargo",
	description: "DondeCargo",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider>
					<div className="min-h-screen flex flex-col">
						<main className="flex-1">
							{children}
						</main>
						<footer className="border-t bg-muted/30 py-12 px-6 md:px-12">
							<div className="container mx-auto">
								<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
									{/* Logo and Brand */}
									<div className="md:col-span-2">
										<div className="flex items-center gap-3 mb-4">
											<div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2">
												<Timer className="h-5 w-5 text-white" />
											</div>
											<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
												DondeCargo
											</span>
										</div>
										<p className="text-sm text-muted-foreground max-w-md">
											Conversational time tracking powered by the Model Context Protocol. 
											Skip complex screens and track your work with natural language.
										</p>
									</div>

									{/* Navigation */}
									<div>
										<h3 className="font-semibold mb-4">Navigation</h3>
										<ul className="space-y-2 text-sm">
											<li>
												<Link href="/" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
													<Home className="h-3 w-3" />
													Home
												</Link>
											</li>
											<li>
												<FooterLink href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2" requireAuth>
													<BarChart3 className="h-3 w-3" />
													Dashboard
												</FooterLink>
											</li>
											<li>
												<Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
													<LogIn className="h-3 w-3" />
													Sign In
												</Link>
											</li>
										</ul>
									</div>

									{/* GitHub Links */}
									<div>
										<h3 className="font-semibold mb-4">Community</h3>
										<ul className="space-y-2 text-sm">
											<li>
												<Link 
													href="https://github.com/lumile/dondecargo-v2" 
													className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2" 
													target="_blank" 
													rel="noopener noreferrer"
												>
													<Github className="h-3 w-3" />
													View on GitHub
												</Link>
											</li>
											<li>
												<Link 
													href="https://github.com/lumile/dondecargo-v2" 
													className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2" 
													target="_blank" 
													rel="noopener noreferrer"
												>
													<Star className="h-3 w-3" />
													Star on GitHub
												</Link>
											</li>
										</ul>
									</div>
								</div>

								{/* Bottom Bar */}
								<div className="border-t mt-8 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
									<div className="flex justify-center sm:justify-start">
										Made with <span className="text-red-500 mx-1">❤️</span> by 
										<Link 
											href="https://www.lumile.com.ar" 
											className="font-medium underline underline-offset-4 ml-1" 
											target="_blank" 
											rel="noopener noreferrer"
										>
											Lumile Argentina S.A.
										</Link>
									</div>
									<div className="flex justify-center sm:justify-end">
										<span className="text-xs">
											MIT License
										</span>
									</div>
								</div>
							</div>
						</footer>
					</div>
				</ThemeProvider>
				<Toaster />
				<Analytics />
			</body>
		</html>
	);
}
