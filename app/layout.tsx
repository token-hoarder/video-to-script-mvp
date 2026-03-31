import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Video-to-Script",
  description: "Generate video scripts from your b-roll footage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${publicSans.variable} h-full antialiased`}
      style={{ colorScheme: 'dark' }}
    >
      <body className={`${publicSans.className} min-h-full flex flex-col bg-zinc-950 text-zinc-50`}>
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
