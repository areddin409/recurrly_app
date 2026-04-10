import { ClerkProvider } from "@clerk/nextjs"
import type { ReactNode } from "react"

export const metadata = { title: "Recurrly Pro" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FFF9E3" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
