import { Link } from 'react-router-dom'
import BrandLogo from '../ui/BrandLogo'
import AuthArtPanel from './AuthArtPanel'

/**
 * Split-screen shell for the auth flows (login / get-started).
 * Left: brand header + form (via `children`). Right: decorative art panel
 * (hidden below `lg`). Optional `headerRight` renders next to the logo.
 */
export default function AuthLayout({ children, headerRight = null, tagline, contentClassName = 'max-w-md' }) {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-gray-950">
      {/* Left — form column */}
      <div className="relative flex flex-col w-full lg:w-1/2 xl:w-[46%]
                      px-6 sm:px-10 lg:px-14 py-8 min-h-screen">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 w-fit hover:opacity-80 transition-opacity">
            <BrandLogo size={34} />
            <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Braify</span>
          </Link>
          {headerRight}
        </div>

        <div className="flex-1 flex flex-col justify-center py-10">
          <div className={`w-full mx-auto ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>

      {/* Right — art column */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[54%] p-3">
        <div className="h-full w-full rounded-[28px] overflow-hidden shadow-xl">
          <AuthArtPanel tagline={tagline} />
        </div>
      </div>
    </div>
  )
}
