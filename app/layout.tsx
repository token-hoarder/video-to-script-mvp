import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { StudioProvider } from "@/contexts/studio-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ViralScript - Script your video with AI precision",
  description: "Transform your raw ideas into viral-ready scripts. ViralScript uses advanced algorithmic sequencing to ensure your content hooks and holds every viewer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-foreground transition-colors duration-300 selection:bg-primary-container selection:text-on-primary-container`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StudioProvider>
            {children}
          </StudioProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
