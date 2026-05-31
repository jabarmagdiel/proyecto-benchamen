"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07060B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#07060B] text-white selection:bg-[#20CDFE]/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#07060B] relative overflow-hidden">
        {/* Glow effect global background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1ED1B4]/5 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#20CDFE]/5 blur-[150px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col h-full">
          <Navbar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
