'use client'

import * as React from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuInner, DropdownMenuItem } from './ui/dropdown-menu'
import { ThemeToggle } from './ThemeToggle'
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

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const isActive = (href: string, subpath?: string) => {
    if (href === '/') return currentPath === '/'
    return currentPath.startsWith(href) || (subpath && currentPath.startsWith('/' + subpath))
  }

  return (
    <>
      <nav 
        className={`w-full px-4 bg-background/80 backdrop-blur-md transition-all duration-300 sticky top-0 z-40 ${
          scrolled ? 'py-2 border-b border-border shadow-sm' : 'py-3 md:py-4 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex-shrink-0 z-50 relative group">
            <div className={`pt-4 pb-1 flex items-end select-none leading-none transition-all duration-300 ease-in-out text-[10px] md:text-xs font-mono tracking-[0.2em] border min-h-[40px] ${
              scrolled 
                ? 'bg-background scale-100 text-foreground border-foreground px-4 rounded-lg hover:bg-accent hover:border-accent hover:text-accent-foreground' 
                : 'bg-foreground scale-110 text-background border-transparent px-3 md:px-4 rounded-none hover:bg-accent hover:text-accent-foreground hover:border-accent'
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
                    className={`transition-all ease-in-out px-3 py-1.5 rounded-none text-[10px] font-mono tracking-[0.2em] flex items-center justify-center ${
                      isBuyMeCoffee
                        ? 'bg-accent text-accent-foreground font-bold border border-transparent hover:shadow-[0_0_15px_hsl(var(--accent)/0.3)]'
                        : `${isActive(href, subpath) ? 'border-b-2 border-accent text-foreground' : 'text-muted-foreground hover:text-accent border-b-2 border-transparent hover:border-accent/50'}`
                    }`}
                  >
                    {link.title}
                  </a>
                </React.Fragment>
              )
            })}
            
            {/* Theme Switcher Separator */}
            <span className="text-muted-foreground/30 px-2 select-none">|</span>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden z-40">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-accent/20 rounded-none transition-colors border border-transparent hover:border-border"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div 
        className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer Content */}
      <div 
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-card border-l border-border z-[50] md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-20">
          <div className="px-6 py-4 border-b border-border/50">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Navigation</p>
          </div>
          
          <div className="flex-grow overflow-y-auto py-4">
            {NAV_LINKS.map((link, index) => {
              const href = link.href ?? `/${link.title.toLowerCase().replaceAll(' ', '-')}`
              const isBuyMeCoffee = link.title === 'Buy Me a Coffee'

              if (link.children) {
                return (
                  <details key={index} className="group border-b border-border/30">
                    <summary className="cursor-pointer px-6 py-4 hover:bg-accent/5 rounded-none font-mono text-xs uppercase tracking-[0.2em] flex items-center justify-between border-l-4 border-transparent hover:border-accent text-muted-foreground hover:text-foreground">
                      {link.title}
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="bg-background/50 py-2">
                      {link.children.map((child, idx) => (
                        <a
                          key={idx}
                          href={child.href.startsWith('//') ? `https:${child.href}` : `/${child.href}`}
                          target={child.href.startsWith('//') ? '_blank' : '_self'}
                          className="block px-10 py-3 hover:bg-accent/5 rounded-none text-xs font-mono tracking-wider transition-colors border-l-4 border-transparent hover:border-accent text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          - {child.title}
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
                  className={`block px-6 py-4 rounded-none font-mono text-xs uppercase tracking-[0.2em] transition-colors border-l-4 border-b border-border/30 ${
                    isBuyMeCoffee
                      ? 'bg-accent/10 border-accent text-accent hover:bg-accent/20'
                      : 'border-transparent text-muted-foreground hover:bg-accent/5 hover:border-accent hover:text-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.title}
                </a>
              )
            })}
          </div>

          <div className="p-6 border-t border-border/50 bg-background/50">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">© {new Date().getFullYear()} Boondit</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
