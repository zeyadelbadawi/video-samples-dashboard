import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ivkcAlcI4SraRoFlYGtALVWdzTli0E.png"
                alt="ZIAD EL-BADAWI"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-bold text-foreground">ZIAD</span>
            </div>
            <p className="text-sm text-foreground/60">Your vision, our code.</p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">Lessons</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">About</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Languages</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">English</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">Spanish</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">More...</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">Terms</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-foreground/60">
            © 2026 ZIAD EL-BADAWI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
