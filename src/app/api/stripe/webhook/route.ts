import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStripeObject = Record<string, any>;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: { type: string; data: { object: AnyStripeObject } };
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!) as typeof event;
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  const { type, data } = event;
  const obj = data.object;

  try {
    switch (type) {
      case "checkout.session.completed": {
        const uid = obj.metadata?.uid as string | undefined;
        const planId = obj.metadata?.planId as string | undefined;
        if (uid && planId) {
          await getAdminDb()
            .collection("profiles")
            .doc(uid)
            .set(
              { stripeCustomerId: obj.customer, subscription: { status: "active", plan: planId } },
              { merge: true }
            );
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const uid = obj.metadata?.uid as string | undefined;
        if (uid) {
          const plan = type === "customer.subscription.deleted" ? "free" : (obj.metadata?.planId ?? "free");
          const status = type === "customer.subscription.deleted" ? "canceled" : obj.status;
          await getAdminDb()
            .collection("profiles")
            .doc(uid)
            .set({ subscription: { status, plan } }, { merge: true });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
