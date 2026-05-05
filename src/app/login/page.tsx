"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, PenLine, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    label: "Research",
    color: "bg-[#ECFDF5] text-emerald-600 border-[#A7F3D0]",
    desc: "Extract sources & requirements",
  },
  {
    icon: PenLine,
    label: "Writing",
    color: "bg-[#F5F3FF] text-violet-600 border-[#C4B5FD]",
    desc: "Draft, revise, polish",
  },
  {
    icon: Zap,
    label: "Action",
    color: "bg-[#E0F2FE] text-sky-600 border-[#7DD3FC]",
    desc: "Submit & present",
  },
];

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles size={24} className="text-[#6366F1]" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            SuccessEngine
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1.5">
            Your AI-powered academic roadmap
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-2.5 mb-8"
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3"
              >
                <div className={`p-2 rounded-lg border ${f.color}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#374151]">{f.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] hover:border-[#C7D2FE] hover:shadow-md rounded-2xl px-5 py-3.5 text-sm font-medium text-[#374151] transition-all duration-200 group"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          <p className="text-xs text-center text-[#D1D5DB] mt-4">
            Free to use · No credit card required
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
