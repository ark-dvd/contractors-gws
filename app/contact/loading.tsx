export default function ContactLoading() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-80 max-w-full bg-gray-200 rounded animate-pulse mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact form skeleton */}
          <div className="bg-white rounded-xl p-8 shadow-md">
            <div className="space-y-6">
              <div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Contact info skeleton */}
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
