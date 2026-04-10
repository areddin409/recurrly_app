"use client"

import { PricingTable } from "@clerk/nextjs"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"

export default function CheckoutPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <SignedIn>
        <PricingTable />
      </SignedIn>
      <SignedOut>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "1rem" }}>Upgrade to Recurrly Pro</h1>
          <SignInButton mode="modal">
            <button style={{ padding: "0.75rem 2rem", background: "#EA7A53", color: "#fff", border: "none", borderRadius: "0.75rem", fontSize: "1rem", cursor: "pointer" }}>
              Sign in to continue
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </main>
  )
}
