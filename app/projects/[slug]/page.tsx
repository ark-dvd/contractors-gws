export default function ProjectDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Project: {params.slug}</h1>
    </main>
  )
}
