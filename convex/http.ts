import { httpRouter } from "convex/server"
import { clerkBillingWebhook } from "./billingWebhook"

const http = httpRouter()

http.route({
  path: "/webhooks/clerk-billing",
  method: "POST",
  handler: clerkBillingWebhook,
})

export default http
