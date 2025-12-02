import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/sonner";
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Script from 'next/script';

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
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{/* Google AdSense script */}
				<Script
				async
				src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
				crossOrigin="anonymous"
				strategy="afterInteractive"
				/>
				<ThemeProvider>
					<div className="min-h-screen flex flex-col">
						<Header />
						<main className="flex-1">
							{children}
						</main>
						<Footer />
					</div>
				</ThemeProvider>
				<a
					href="https://cafecito.app/dondecargo"
					rel="noopener"
					target="_blank"
					className="fixed left-3 bottom-24 md:left-4 md:bottom-30 lg:left-4 lg:bottom-8 z-9000"
				>
					<img
						srcSet="https://cdn.cafecito.app/imgs/buttons/button_1.png 1x, https://cdn.cafecito.app/imgs/buttons/button_1_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_1_3.75x.png 3.75x"
						src="https://cdn.cafecito.app/imgs/buttons/button_1.png"
						alt="Invitame un café en cafecito.app"
					/>
				</a>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
