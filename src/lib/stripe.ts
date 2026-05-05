import Stripe from "stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any,
});

export type PlanId = "free" | "scholar" | "ace";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  uploadsPerMonth: number;
  features: string[];
  priceId: string | null;
  badge?: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Perfect for getting started",
    price: 0,
    uploadsPerMonth: 3,
    priceId: null,
    features: [
      "3 PDF analyses per month",
      "Up to 5 tasks per roadmap",
      "Basic phase planning",
      "7-day assignment history",
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    tagline: "For the dedicated student",
    price: 3.99,
    uploadsPerMonth: 30,
    priceId: process.env.STRIPE_SCHOLAR_PRICE_ID ?? null,
    badge: "Most Popular",
    features: [
      "30 PDF analyses per month",
      "Up to 10 tasks per roadmap",
      "Priority AI processing",
      "Full assignment history",
      "Progress tracking",
    ],
  },
  {
    id: "ace",
    name: "Ace",
    tagline: "Crush every deadline",
    price: 7.99,
    uploadsPerMonth: -1,
    priceId: process.env.STRIPE_ACE_PRICE_ID ?? null,
    features: [
      "Unlimited PDF analyses",
      "Unlimited tasks per roadmap",
      "Priority AI processing",
      "Full assignment history",
      "Progress tracking",
      "Calendar export (coming soon)",
    ],
  },
];
