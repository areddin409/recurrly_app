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
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown }
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  // 4. Handle events
  // v1: log only. v2: upsert billing record / revoke session on subscription.deleted
  switch (event.type) {
    case "subscription.created":
      console.log("[billing] subscription.created", JSON.stringify(event.data))
      break
    case "subscription.updated":
      console.log("[billing] subscription.updated", JSON.stringify(event.data))
      break
    case "subscription.deleted":
      // NOTE: user retains Pro entitlement until Clerk session token expires.
      // In v2, call Clerk Backend API to revoke active sessions for this user.
      console.log("[billing] subscription.deleted", JSON.stringify(event.data))
      break
    default:
      // Unknown event type — acknowledge and ignore
      break
  }

  return new Response(null, { status: 200 })
})
