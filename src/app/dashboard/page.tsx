"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { subscribeToAssignments, Assignment } from "@/lib/firestore";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Nexus } from "@/components/Nexus";
import { toast } from "sonner";
import Link from "next/link";
import {
  Sparkles,
  LogOut,
  Plus,
  X,
  GraduationCap,
  BookOpen,
  PenLine,
  Zap,
  TrendingUp,
} from "lucide-react";

const STATS_CONFIG = [
  { phase: "research" as const, label: "Research", icon: BookOpen, bg: "bg-[#ECFDF5]", border: "border-[#A7F3D0]", text: "text-emerald-600" },
  { phase: "writing" as const, label: "Writing", icon: PenLine, bg: "bg-[#F5F3FF]", border: "border-[#C4B5FD]", text: "text-violet-600" },
  { phase: "action" as const, label: "Action", icon: Zap, bg: "bg-[#E0F2FE]", border: "border-[#7DD3FC]", text: "text-sky-600" },
];

function PaymentToast() {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Subscription activated!", {
        description: "Welcome to your new plan. Enjoy all the features.",
      });
    }
  }, [searchParams]);
  return null;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showNexus, setShowNexus] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAssignments(user.uid, setAssignments);
    return unsub;
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#C7D2FE] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const totalTasks = assignments.reduce((a, b) => a + (b.roadmap?.length ?? 0), 0);
  const avgProgress =
    assignments.length > 0
      ? Math.round(assignments.reduce((a, b) => a + (b.progress ?? 0), 0) / assignments.length)
      : 0;

  const phaseCounts = STATS_CONFIG.map((s) => ({
    ...s,
    count: assignments.filter((a) =>
      a.roadmap?.some((t) => t.phase === s.phase)
    ).length,
  }));

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Suspense fallback={null}>
        <PaymentToast />
      </Suspense>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center">
              <Sparkles size={13} className="text-[#6366F1]" />
            </div>
            <span className="font-semibold text-[#111827] text-sm tracking-tight">
              SuccessEngine
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-xs font-medium text-[#6366F1] hover:text-[#4F46E5] transition-colors hidden sm:block"
            >
              Upgrade
            </Link>
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "Avatar"}
                  className="w-7 h-7 rounded-full border border-[#E5E7EB]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#6366F1]">
                    {user.displayName?.[0] ?? "U"}
                  </span>
                </div>
              )}
              <span className="text-xs text-[#6B7280] hidden sm:block">
                {user.displayName?.split(" ")[0]}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            The Atrium
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            {assignments.length === 0
              ? "Upload your first assignment to get started."
              : `${assignments.length} assignment${assignments.length !== 1 ? "s" : ""} · ${totalTasks} tasks total`}
          </p>
        </motion.div>

        {/* Stats row */}
        {assignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#6366F1]" />
                <span className="text-xs text-[#9CA3AF]">Avg Progress</span>
              </div>
              <p className="text-2xl font-bold text-[#111827]">{avgProgress}<span className="text-sm font-normal text-[#9CA3AF]">%</span></p>
            </div>
            {phaseCounts.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.phase}
                  className={`${s.bg} border ${s.border} rounded-2xl p-4`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className={s.text} />
                    <span className={`text-xs ${s.text}`}>{s.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${s.text}`}>
                    {s.count}
                    <span className="text-sm font-normal opacity-60 ml-0.5">tasks</span>
                  </p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Nexus panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#374151]">The Nexus</h2>
            <button
              onClick={() => setShowNexus((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                showNexus
                  ? "bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280]"
                  : "bg-[#6366F1] border-[#6366F1] text-white hover:bg-[#4F46E5]"
              }`}
            >
              {showNexus ? (
                <><X size={12} /> Collapse</>
              ) : (
                <><Plus size={12} /> Upload Assignment</>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showNexus && (
              <motion.div
                key="nexus"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <Nexus onComplete={() => setShowNexus(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Assignments grid */}
        <div>
          <h2 className="text-sm font-semibold text-[#374151] mb-4">
            Your Assignments
          </h2>

          {assignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center mb-4">
                <GraduationCap size={24} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#6B7280]">No assignments yet</p>
              <p className="text-xs text-[#D1D5DB] mt-1">Upload a PDF to generate your first roadmap</p>
              <button
                onClick={() => setShowNexus(true)}
                className="mt-5 px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-xl hover:bg-[#4F46E5] transition-colors"
              >
                Upload your first assignment
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a, i) => (
                <AssignmentCard key={a.id} assignment={a} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
