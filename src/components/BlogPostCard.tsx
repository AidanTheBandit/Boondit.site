'use client'

import * as React from 'react'
import { Card, CardContent } from './ui/card'

interface BlogPostCardProps {
  title: string
  slug: string
  excerpt: string
  date: Date
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ title, slug, excerpt, date }) => {
  const formattedDate = date.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className="h-full flex flex-col group relative overflow-hidden bg-card/40 hover:bg-card border-border/50 hover:border-foreground/30 transition-all duration-500">
      <CardContent className="p-6 md:p-8 flex-grow flex flex-col">
        <a href={`/blog/${slug}`} className="block flex-grow group-hover:no-underline">
          {/* Header with Icon */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground border border-border/50 px-2 py-1 bg-background/50">
              Log
            </span>
            <span className="text-xs text-muted-foreground/70 font-mono tracking-wide">
              {formattedDate}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-light tracking-tight text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
            {title}
          </h2>

          <p className="text-muted-foreground text-sm md:text-base font-light leading-relaxed line-clamp-3 mb-8 flex-grow">
            {excerpt}
          </p>

          <div className="flex items-center text-xs uppercase tracking-widest text-muted-foreground font-medium mt-auto group-hover:text-foreground transition-colors duration-300">
            Read Article
            <svg
              className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={1.5}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </a>
      </CardContent>
    </Card>
  )
}

export default BlogPostCard
