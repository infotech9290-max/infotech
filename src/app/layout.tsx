import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = { themeColor: "#0ea5e9" };

export const metadata: Metadata = {
  title: {
    default: "Admission Portal — Institute Management System",
    template: "%s | Admission Portal",
  },
  description:
    "Professional Admission Management System — Manage student admissions, fees, EMI plans, documents and counselor staff from one secure dashboard.",
  keywords: ["admission portal", "institute management", "student admission", "fee management", "counselor dashboard"],
  authors: [{ name: "InfoTech" }],
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Admission Portal — Institute Management System",
    description: "Professional Admission Management System for Institutes & Coaching Centers",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Admission Portal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Admission Portal",
    description: "Professional Admission Management System",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var r of regs) r.unregister();
                });
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var n of names) caches.delete(n);
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
