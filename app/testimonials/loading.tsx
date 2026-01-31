export default function TestimonialsLoading() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-72 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-96 max-w-full bg-gray-200 rounded animate-pulse mx-auto" />
        </div>

        {/* Testimonials grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-md">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              {/* Quote */}
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
