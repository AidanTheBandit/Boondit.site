'use client'

import * as React from 'react'
import { SITE_TITLE } from '@/consts'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <section
      id="footer"
      className="w-full relative place-items-center py-12 md:py-16 mt-20 border-t border-border/50"
    >
      <div className="absolute top-0 right-10 w-px h-8 bg-accent"></div>
      <div className="flex flex-col gap-6 items-center">
        <a
          href="https://buymeacoffee.com/boondit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-105"
        >
          <img
            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=boondit&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
            alt="Buy Me A Coffee"
            style={{ height: '60px !important', width: '217px !important' }}
          />
        </a>
        <div className="px-6 md:px-10 py-3 border border-border/50 bg-background/50 backdrop-blur-sm rounded-none text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          SYS_TERM // &copy; {currentYear} {SITE_TITLE} // [END_OF_TRANSMISSION]
        </div>
      </div>
    </section>
  )
}

export default Footer
