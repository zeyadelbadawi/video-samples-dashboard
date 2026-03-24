import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ivkcAlcI4SraRoFlYGtALVWdzTli0E.png"
            alt="ZIAD EL-BADAWI"
            width={40}
            height={40}
            className="h-8 w-auto"
          />
          <span className="text-sm font-bold text-foreground">ZIAD</span>
        </div>
        <nav className="hidden gap-8 md:flex">
          <a href="#videos" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Lessons
          </a>
          <a href="#cta" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Get Started
          </a>
        </nav>
        <Button className="bg-accent text-accent-foreground hover:opacity-90">
          Sign In
        </Button>
      </div>
    </header>
  )
}
