import { httpActionGeneric as httpAction } from "convex/server"
import { Webhook } from "svix"

export const clerkBillingWebhook = httpAction(async (_ctx, request) => {
  // 1. Read raw body
  const body = await request.text()

  // 2. Extract svix signature headers
  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  // 3. Verify signature
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error("[billing] CLERK_WEBHOOK_SECRET is not set")
    return new Response("Server misconfiguration", { status: 500 })
  }

  let event: { type: string; data: unknown }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature
    }) as { type: string; data: unknown }
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  // 4. Handle events
  // v1: log only. v2: upsert billing record / revoke session on cancellation.
  // NOTE: Clerk does not emit subscription.deleted — cancellations come via
  // subscriptionItem.canceled and subscriptionItem.ended.
  switch (event.type) {
    case "subscription.created":
      console.log("[billing] subscription.created", JSON.stringify(event.data))
      break
    case "subscription.updated":
      console.log("[billing] subscription.updated", JSON.stringify(event.data))
      break
    case "subscription.active":
      console.log("[billing] subscription.active", {
        id: (event.data as any)?.id,
        status: (event.data as any)?.status
      })
      break
    case "subscription.pastDue":
      console.log("[billing] subscription.pastDue", {
        id: (event.data as any)?.id,
        status: (event.data as any)?.status
      })
      break
    case "subscriptionItem.canceled":
      // NOTE: user retains Pro entitlement until Clerk session token expires.
      // In v2, call Clerk Backend API to revoke active sessions for this user.
      console.log("[billing] subscriptionItem.canceled", {
        id: (event.data as any)?.id,
        status: (event.data as any)?.status
      })
      break
    case "subscriptionItem.ended":
      console.log("[billing] subscriptionItem.ended", {
        id: (event.data as any)?.id,
        status: (event.data as any)?.status
      })
      break
    default:
      // Unknown event type — acknowledge and ignore
      break
  }

  return new Response(null, { status: 200 })
})
