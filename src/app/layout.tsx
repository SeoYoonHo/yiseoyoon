import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { BackgroundProvider } from "@/contexts/BackgroundContext";
import ConsoleSuppressor from "@/components/ConsoleSuppressor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "yiseoyoon - Personal Art Portfolio",
  description: "Personal portfolio website showcasing yiseoyoon's art works.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConsoleSuppressor />
        <BackgroundProvider>
          <NavBar />
          {children}
        </BackgroundProvider>
      </body>
    </html>
  );
}
