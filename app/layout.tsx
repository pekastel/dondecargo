import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/sonner";
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CafecitoButton } from '@/components/layout/CafecitoButton'
import { env } from "@/lib/env";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

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
		<html lang="es">
			<head>
				{/* Google AdSense script - placed in head to avoid data-nscript attribute issue */}
				{env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
					<script
						async
						src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
						crossOrigin="anonymous"
					/>
				)}
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider>
					<div className="min-h-screen flex flex-col">
						<Header />
						<main className="flex-1">{children}</main>
						<Footer />
					</div>
				</ThemeProvider>
				<CafecitoButton />
				<GoogleAnalytics />
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
