'use client'

import * as React from 'react'
import { Card, CardContent } from './ui/card'

interface BlogPostCardProps {
  slug: string
  title: string
  excerpt: string
  date: Date
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ slug, title, excerpt, date }) => {
  const formattedDate = new Intl.DateTimeTimeFormat('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)

  return (
    <Card className="h-full flex flex-col group relative overflow-hidden bg-card/60 hover:bg-card border-border/50 hover:border-accent/40 shadow-sm hover:shadow-[0_4_20px_hsl(var(--accent)/0.1)] transition-all duration-300 rounded-xl">
      {/* Accent Top Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(var(--color-pink))] via-[hsl(var(--color-purple))] to-[hsl(var(--color-gray))] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>
      
      <CardContent className="p-6 md:p-8 flex-grow flex flex-col relative z-10 w-full h-full">
        <a href={`/blog/${slug}`} className="block flex-grow group-hover:no-underline">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
              Post
            </span>
            <span className="text-xs text-muted-foreground/70 tracking-wide font-medium">
              {formattedDate}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
            {title}
          </h2>

          <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed line-clamp-3 mb-8 flex-grow">
            {excerpt}
          </p>

          <div className="flex items-center text-sm font-semibold text-muted-foreground mt-auto group-hover:text-primary transition-colors duration-300">
            Read post
            <svg
              className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
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
