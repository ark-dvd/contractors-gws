export default function AboutLoading() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="space-y-3">
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
