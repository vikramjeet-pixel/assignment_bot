"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PLANS, Plan } from "@/lib/stripe";
import { toast } from "sonner";

const planIcons = {
  free: BookOpen,
  scholar: Sparkles,
  ace: Zap,
};

const planAccents = {
  free: {
    icon: "bg-[#F3F4F6] text-[#6B7280]",
    badge: "",
    ring: "border-[#E5E7EB]",
    button: "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]",
    checkmark: "text-[#6B7280]",
  },
  scholar: {
    icon: "bg-[#EEF2FF] text-[#6366F1]",
    badge: "bg-[#6366F1] text-white",
    ring: "border-[#6366F1] ring-2 ring-[#6366F1]/20",
    button: "bg-[#6366F1] text-white hover:bg-[#4F46E5]",
    checkmark: "text-[#6366F1]",
  },
  ace: {
    icon: "bg-[#ECFDF5] text-emerald-600",
    badge: "",
    ring: "border-[#E5E7EB]",
    button: "bg-[#111827] text-white hover:bg-[#374151]",
    checkmark: "text-emerald-600",
  },
};

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelect(plan: Plan) {
    if (plan.id === "free") {
      router.push(user ? "/dashboard" : "/login");
      return;
    }

    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    if (!plan.priceId) {
      toast.error("This plan is not yet configured. Please add Stripe price IDs.");
      return;
    }

    setLoading(plan.id);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, uid: user.uid, email: user.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Checkout failed", { description: message });
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6366F1] mb-3">
          Pricing
        </p>
        <h1 className="text-3xl font-bold text-[#111827] mb-3">
          Simple, honest pricing
        </h1>
        <p className="text-[#6B7280] text-sm max-w-sm mx-auto">
          Built for students. No hidden fees, no surprise charges. Cancel anytime.
        </p>
      </motion.div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const accent = planAccents[plan.id];
          const Icon = planIcons[plan.id];
          const isLoading = loading === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative bg-white rounded-2xl border p-6 flex flex-col ${accent.ring}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold ${accent.badge}`}>
                  {plan.badge}
                </div>
              )}

              {/* Icon + name */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${accent.icon}`}>
                <Icon size={18} />
              </div>

              <p className="font-bold text-[#111827] text-lg">{plan.name}</p>
              <p className="text-xs text-[#9CA3AF] mb-4">{plan.tagline}</p>

              {/* Price */}
              <div className="mb-6">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-[#111827]">Free</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-[#111827]">${plan.price}</span>
                    <span className="text-sm text-[#9CA3AF] mb-1">/month</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <Check size={14} className={`mt-0.5 shrink-0 ${accent.checkmark}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSelect(plan)}
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${accent.button}`}
              >
                {isLoading
                  ? "Redirecting..."
                  : plan.price === 0
                  ? "Get started free"
                  : `Get ${plan.name}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-[#D1D5DB] mt-10">
        Paid plans include a 14-day free trial · Secure checkout via Stripe
      </p>
    </main>
  );
}
