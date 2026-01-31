export default function ServiceDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Service: {params.slug}</h1>
    </main>
  )
}
