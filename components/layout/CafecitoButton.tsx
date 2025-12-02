'use client'

import { usePathname } from 'next/navigation'

export function CafecitoButton() {
  const pathname = usePathname()
  
  // Don't show on home page
  if (pathname === '/') {
    return null
  }

  // On map page (/buscar), use bottom-8 on lg; otherwise bottom-20
  const isMapPage = pathname === '/buscar'
  const bottomClass = isMapPage ? 'lg:bottom-8' : 'lg:bottom-20'

  return (
    <a
      href="https://cafecito.app/dondecargo"
      rel="noopener"
      target="_blank"
      className={`fixed left-3 top-40 lg:top-auto lg:left-4 ${bottomClass} z-1000`}
    >
      <img
        srcSet="https://cdn.cafecito.app/imgs/buttons/button_1.png 1x, https://cdn.cafecito.app/imgs/buttons/button_1_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_1_3.75x.png 3.75x"
        src="https://cdn.cafecito.app/imgs/buttons/button_1.png"
        alt="Invitame un café en cafecito.app"
        className="w-30 lg:w-auto"
      />
    </a>
  )
}
