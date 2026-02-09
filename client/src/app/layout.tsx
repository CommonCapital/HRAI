import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from 'nuqs/adapters/next';
const inter = Inter({
 
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "HRAI",
  description: "Train custom AI agents on your hiring standards. They screen, interview, verify, and recommend—autonomously. No black boxes. No bias. Just structured intelligence at scale.",
  icons: {
    icon: "/logo.svg",
    
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
    <TRPCReactProvider>
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <Toaster />
        {children}
      </body>
    </html>
    </TRPCReactProvider>
    </NuqsAdapter>
  );
}
