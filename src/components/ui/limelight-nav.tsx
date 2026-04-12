import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react'

type NavItem = {
  id: string | number
  icon: React.ReactElement<{ className?: string }>
  label?: string
  onClick?: () => void
}

type LimelightNavProps = {
  items?: NavItem[]
  defaultActiveIndex?: number
  onTabChange?: (index: number) => void
  className?: string
  limelightClassName?: string
  iconContainerClassName?: string
  iconClassName?: string
}

export type { NavItem }

export const LimelightNav = ({
  items = [],
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex)
  const [isReady, setIsReady] = useState(false)
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const limelightRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (items.length === 0) return

    const limelight = limelightRef.current
    const activeItem = navItemRefs.current[activeIndex]

    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2
      limelight.style.left = `${newLeft}px`

      if (!isReady) {
        setTimeout(() => setIsReady(true), 50)
      }
    }
  }, [activeIndex, isReady, items])

  if (items.length === 0) {
    return null
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setActiveIndex(index)
    onTabChange?.(index)
    itemOnClick?.()
  }

  return (
    <nav
      className={`bg-card text-foreground relative inline-flex h-16 items-center rounded-lg border px-2 ${className ?? ''}`}
    >
      {items.map(({ id, icon, label, onClick }, index) => (
        <a
          key={id}
          ref={(el) => {
            navItemRefs.current[index] = el
          }}
          className={`relative z-20 flex h-full cursor-pointer items-center justify-center p-5 ${iconContainerClassName ?? ''}`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
        >
          {cloneElement(icon, {
            className: `w-6 h-6 transition-opacity duration-100 ease-in-out ${
              activeIndex === index ? 'opacity-100' : 'opacity-40'
            } ${icon.props.className || ''} ${iconClassName || ''}`,
          })}
        </a>
      ))}

      <div
        ref={limelightRef}
        className={`bg-primary absolute top-0 z-10 h-[5px] w-11 rounded-full shadow-[0_50px_15px_var(--primary)] ${
          isReady ? 'transition-[left] duration-400 ease-in-out' : ''
        } ${limelightClassName ?? ''}`}
        style={{ left: '-999px' }}
      >
        <div className="from-primary/30 pointer-events-none absolute top-[5px] left-[-30%] h-14 w-[160%] bg-gradient-to-b to-transparent [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)]" />
      </div>
    </nav>
  )
}
