import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section id="cta" className="py-20 md:py-32 bg-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <h2 className="text-balance text-4xl md:text-5xl font-bold text-background mb-6">
            Ready to start learning?
          </h2>
          <p className="text-lg text-background/80 mb-8 leading-relaxed">
            Join thousands of language learners and begin your journey to fluency with our authentic video lessons from native speakers.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90 text-base">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
