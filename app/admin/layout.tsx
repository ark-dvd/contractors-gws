// Force dynamic rendering for all admin routes
// This ensures CSP nonces are applied at request time
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
