'use client'

import * as React from 'react'
import { SITE_TITLE } from '@/consts'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <section
      id="footer"
      className="w-full grid relative place-items-center text-center py-6 md:py-8 bg-card/10 mt-8"
    >
      <div className="flex flex-col gap-4 items-center">
        <a
          href="https://buymeacoffee.com/boondit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=boondit&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
            alt="Buy Me A Coffee"
            style={{ height: '60px !important', width: '217px !important' }}
          />
        </a>
        <div className="px-6 md:px-10 py-3 border border-border/50 bg-background rounded shadow-sm text-sm text-muted-foreground tracking-wide font-light">
          &copy; {currentYear} {SITE_TITLE}. All rights reserved.
        </div>
      </div>
    </section>
  )
}

export default Footer
