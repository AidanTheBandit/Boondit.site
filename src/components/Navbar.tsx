'use client'

import * as React from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuInner, DropdownMenuItem } from './ui/dropdown-menu'
import { SITE_TITLE, NAV_LINKS } from '@/consts'

interface NavbarProps {
  currentPath?: string
}

const Navbar: React.FC<NavbarProps> = ({ currentPath = '' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string, subpath?: string) => {
    if (href === '/') return currentPath === '/'
    return currentPath.startsWith(href) || (subpath && currentPath.startsWith('/' + subpath))
  }

  return (
    <nav 
      className={`w-full px-4 bg-background/80 backdrop-blur-md transition-all duration-300 sticky top-0 z-40 ${
        scrolled ? 'py-2 border-b border-border shadow-sm' : 'py-3 md:py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/" className="flex-shrink-0 z-50 relative group">
          <div className={`pt-2 pb-1 grid place-items-center select-none leading-none transition-all duration-300 ease-in-out text-sm md:text-base border ${
            scrolled ? 'bg-background scale-100 text-foreground border-foreground px-4' : 'bg-foreground scale-110 text-background border-transparent px-3 md:px-4'
          }`}>
            {SITE_TITLE}
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link, index) => {
            const href = link.href ?? `/${link.title.toLowerCase().replaceAll(' ', '-')}`
            const isBuyMeCoffee = link.title === 'Buy Me a Coffee'
            const subpath = link.title.toLowerCase().replaceAll(' ', '-')

            if (link.children) {
              return (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-muted-foreground/30 px-2 select-none">/</span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      {link.title}
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuInner>
                        {link.children.map((child, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            href={child.href.startsWith('//') ? `https:${child.href}` : `/${child.href}`}
                            target={child.href.startsWith('//') ? '_blank' : '_self'}
                          >
                            {child.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuInner>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </React.Fragment>
              )
            }

            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-muted-foreground/30 px-2 select-none">/</span>
                )}
                <a
                  href={href.startsWith('//') ? `https:${href}` : href}
                  target={isBuyMeCoffee ? '_blank' : '_self'}
                  className={`transition-all ease-in-out px-3 py-1.5 rounded text-sm md:text-sm tracking-wide flex items-center justify-center font-medium ${
                    isBuyMeCoffee
                      ? 'bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 hover:text-black/80 font-bold border border-transparent shadow-[0_0_10px_rgba(255,221,0,0.3)]'
                      : `${isActive(href, subpath) ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`
                  }`}
                >
                  {link.title}
                </a>
              </React.Fragment>
            )
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden z-40 p-2 hover:bg-accent/20 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-transparent pt-4">
          {NAV_LINKS.map((link, index) => {
            const href = link.href ?? `/${link.title.toLowerCase().replaceAll(' ', '-')}`
            const isBuyMeCoffee = link.title === 'Buy Me a Coffee'

            if (link.children) {
              return (
                <details key={index} className="group">
                  <summary className="cursor-pointer px-3 py-2 hover:bg-accent/20 rounded-md font-medium flex items-center justify-between">
                    {link.title}
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="pl-4 mt-2 space-y-2">
                    {link.children.map((child, idx) => (
                      <a
                        key={idx}
                        href={child.href.startsWith('//') ? `https:${child.href}` : `/${child.href}`}
                        target={child.href.startsWith('//') ? '_blank' : '_self'}
                        className="block px-3 py-2 hover:bg-accent/20 rounded-md text-sm transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.title}
                      </a>
                    ))}
                  </div>
                </details>
              )
            }

            return (
              <a
                key={index}
                href={href.startsWith('//') ? `https:${href}` : href}
                target={isBuyMeCoffee ? '_blank' : '_self'}
                className={`block px-3 py-2 rounded-md font-medium transition-colors ${
                  isBuyMeCoffee
                    ? 'bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90'
                    : 'hover:bg-accent/20'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.title}
              </a>
            )
          })}
        </div>
      )}
    </nav>
  )
}

export default Navbar
