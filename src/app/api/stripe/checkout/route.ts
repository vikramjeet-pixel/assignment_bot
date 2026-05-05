import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { planId, uid, email } = (await req.json()) as {
      planId: PlanId;
      uid: string;
      email: string;
    };

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || !plan.priceId) {
      return NextResponse.json({ error: "Invalid plan or no price configured." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      metadata: { uid, planId },
      customer_email: email,
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: { metadata: { uid, planId } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
