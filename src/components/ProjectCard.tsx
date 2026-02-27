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
    <Card className="h-full flex flex-col group relative overflow-hidden bg-card/40 hover:bg-card border-border/50 hover:border-foreground/30 transition-all duration-500">
      <CardContent className="p-6 md:p-8 flex-grow flex flex-col">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block flex-grow group-hover:no-underline"
          >
            {/* Header with Tag */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground border border-border/50 px-2 py-1 bg-background/50">
                Project
              </span>
              <span className="text-xs text-muted-foreground/70 font-mono tracking-wide">
                {period}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-light tracking-tight text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
              {title}
            </h2>

            <p className="text-muted-foreground text-sm md:text-base font-light leading-relaxed line-clamp-3 mb-8 flex-grow">
              {description}
            </p>

            <div className="flex items-center text-xs uppercase tracking-widest text-muted-foreground font-medium mt-auto group-hover:text-foreground transition-colors duration-300">
              Visit Project
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
        ) : (
          <div className="block flex-grow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground/50 border border-border/30 px-2 py-1 bg-background/30">
                Project
              </span>
              <span className="text-xs text-muted-foreground/50 font-mono tracking-wide">
                {period}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-light tracking-tight text-foreground/70 mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground/70 text-sm md:text-base font-light leading-relaxed line-clamp-3 mb-8 flex-grow">
              {description}
            </p>

            <div className="text-muted-foreground/40 text-xs uppercase tracking-widest mt-auto">
              Coming soon
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProjectCard
