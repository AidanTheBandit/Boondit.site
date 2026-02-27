'use client'

import * as React from 'react'

interface BreadcrumbProps {
  title: string
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title = 'Title' }) => {
  return (
    <div className="bg-secondary/50 border border-border/50 flex items-center justify-center leading-none pt-2 pb-1 text-center select-none px-4 py-1.5 font-medium text-secondary-foreground w-fit text-xs md:text-sm hover:bg-secondary hover:border-foreground/30 transition-all duration-300">
      <span className="tracking-wide">{title}</span>
    </div>
  )
}

export default Breadcrumb
