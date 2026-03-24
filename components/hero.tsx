'use client'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-background/50 py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl leading-tight">
            Learn Languages from <span className="text-accent">Real People</span>
          </h1>
          <p className="mt-6 text-xl text-foreground/70 leading-relaxed">
            Master English and Spanish through authentic video lessons from native speakers. Your vision, our code.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90 text-base">
              Start Learning
            </Button>
            <Button size="lg" variant="outline" className="text-base border-foreground/20 hover:bg-foreground/5">
              View Lessons
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
