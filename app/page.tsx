import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { VideoGrid } from '@/components/video-grid'
import { CTA } from '@/components/cta'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <VideoGrid />
      <CTA />
      <Footer />
    </main>
  )
}
