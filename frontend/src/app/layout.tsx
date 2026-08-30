import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ADDONS",
  description: "Sistema de gestión de proyectos y actividades para agencias de marketing y software",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
