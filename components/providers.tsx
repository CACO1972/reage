"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { AuthProvider } from "@/hooks/useAuth"
import { AudioProvider } from "@/contexts/AudioContext"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioProvider>
          {children}
        </AudioProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
