export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 py-6 dark:border-gray-700">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Data source:{' '}
          <a
            href="https://jobsearch.az"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            JobSearch
          </a>{' '}
          and{' '}
          <a
            href="https://glorri.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Glorri
          </a>{' '}
          | IT Category
        </p>
      </div>
    </footer>
  )
}
