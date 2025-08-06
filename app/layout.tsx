import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import { Github, Star, Timer, Home, BarChart3, LogIn } from "lucide-react";
import { FooterLink } from "@/components/footer-link";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { Header } from '@/components/layout/Header'

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
						<Header />
						<main className="flex-1">
							{children}
						</main>
						<footer className="bg-muted/30 py-12 px-2 md:px-2">
							<div className="container mx-auto">
								{/* Bottom Bar */}
								<div className="border-t mt-8 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
									<div className="flex justify-center sm:justify-start">
										Hecho con <span className="text-red-500 mx-1">❤️</span> por 
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
										<Link 
											href="/terminos-y-condiciones.html"
											target="_blank"
											className="font-medium underline underline-offset-4 ml-1" 
										>
											Términos y Condiciones
										</Link>
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
