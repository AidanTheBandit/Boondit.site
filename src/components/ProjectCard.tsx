'use client'

import * as React from 'react'
import { Card, CardContent } from './ui/card'

interface ProjectCardProps {
  title: string
  period: string
  link?: string
  description: string
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, period, link, description }) => {
  return (
    <Card className="h-full flex flex-col group relative overflow-hidden bg-card/60 hover:bg-card border-border/50 hover:border-accent/40 shadow-sm hover:shadow-[0_4_20px_hsl(var(--accent)/0.1)] transition-all duration-300 rounded-xl">
      {/* Accent Top Bar */}
      <div className="absolute top-0 left-0 w-full h-1 flex scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top opacity-50">
        <div className="flex-1 bg-[hsl(var(--color-pink))]"></div>
        <div className="flex-1 bg-[hsl(var(--color-purple))]"></div>
        <div className="flex-1 bg-[hsl(var(--color-gray))]"></div>
      </div>

      <CardContent className="p-6 md:p-8 flex-grow flex flex-col relative z-10 w-full h-full">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block flex-grow group-hover:no-underline"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
                Project
              </span>
              <span className="text-xs text-muted-foreground/70 tracking-wide font-medium">
                {period}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
              {title}
            </h2>

            <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed line-clamp-3 mb-8 flex-grow">
              {description}
            </p>

            <div className="flex items-center text-sm font-semibold text-muted-foreground mt-auto group-hover:text-primary transition-colors duration-300">
              Visit project
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </a>
        ) : (
          <div className="block flex-grow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full opacity-70">
                Project
              </span>
              <span className="text-xs text-muted-foreground/50 tracking-wide font-medium">
                {period}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground/80 mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground/80 text-sm md:text-base font-medium leading-relaxed line-clamp-3 mb-8 flex-grow">
              {description}
            </p>

            <div className="text-muted-foreground/50 text-sm font-semibold mt-auto">
              Coming soon
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProjectCard
