import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/*
  What is this file doing?
  While `client.ts` is used for the browser, this file creates a Supabase client
  specifically for our Next.js SERVER (like Server Components and API Routes).
  
  Because the server needs to know *who* is making the request, we have to pass it
  the browser's cookies. This code securely grabs the cookies and attaches them to 
  our Supabase requests!
*/
export async function createClient() {
  // In Next.js 15, reading cookies is an asynchronous action!
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // We can safely ignore this error because our Middleware (which we are building next)
            // will handle the actual setting of cookies.
          }
        },
      },
    }
  )
}
