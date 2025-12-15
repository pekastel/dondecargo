 "use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { env } from "@/lib/env";

const GA_ID = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === "undefined") return;

    const url = window.location.pathname + window.location.search;

    // @ts-expect-error - gtag is injected by the GA script
    window.gtag?.("event", "page_view", {
      page_path: url,
    });
  }, [pathname]);

  if (!GA_ID) return null;

  return (
    <>
      {/* Script base de Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* Configuración inicial de GA4 */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}


