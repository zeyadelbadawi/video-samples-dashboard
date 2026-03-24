'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play } from 'lucide-react'

const videos = [
  {
    id: 'british_01',
    title: 'Real British English Conversations',
    channel: 'My English Coach Dave',
    language: 'British English',
    duration: '30 sec',
    description: 'Real British conversations in a small town',
    url: 'https://www.youtube.com/watch?v=QCvJMTSzGPo',
    thumbnail: 'https://img.youtube.com/vi/QCvJMTSzGPo/maxresdefault.jpg',
  },
  {
    id: 'british_02',
    title: 'British Accent Shadowing - Pride and Prejudice',
    channel: 'Ashley Howard',
    language: 'British English',
    duration: '19 sec',
    description: 'Learn RP pronunciation with classic literature',
    url: 'https://www.youtube.com/watch?v=5Rde32zipGk',
    thumbnail: 'https://img.youtube.com/vi/5Rde32zipGk/maxresdefault.jpg',
  },
  {
    id: 'spanish_01',
    title: 'Interview in Spanish - Meet Paul',
    channel: 'Why Not Spanish?',
    language: 'Spanish',
    duration: '14 sec',
    description: 'Spanish listening activity with real conversation',
    url: 'https://www.youtube.com/watch?v=vRMAc1UgW-w',
    thumbnail: 'https://img.youtube.com/vi/vRMAc1UgW-w/maxresdefault.jpg',
  },
  {
    id: 'spanish_02',
    title: 'Gipsy Kings - Bamboléo',
    channel: 'Gipsy Kings',
    language: 'Spanish',
    duration: '10 sec',
    description: 'Learn Spanish through authentic music',
    url: 'https://www.youtube.com/watch?v=GGqcpDSUJlE',
    thumbnail: 'https://img.youtube.com/vi/GGqcpDSUJlE/maxresdefault.jpg',
  },
  {
    id: 'american_01',
    title: 'Very Simple Spanish Story for Beginners',
    channel: 'ListenES',
    language: 'English & Spanish',
    duration: '30 sec',
    description: 'Perfect for beginners - my perfect day story',
    url: 'https://www.youtube.com/watch?v=5oTmkLZcFxE',
    thumbnail: 'https://img.youtube.com/vi/5oTmkLZcFxE/maxresdefault.jpg',
  },
  {
    id: 'american_02',
    title: 'Think Fast, Talk Smart',
    channel: 'Stanford Graduate School',
    language: 'American English',
    duration: '5 sec',
    description: 'Communication techniques from Stanford',
    url: 'https://www.youtube.com/watch?v=HAnw168huqA',
    thumbnail: 'https://img.youtube.com/vi/HAnw168huqA/maxresdefault.jpg',
  },
]

const languageBadgeVariant = (language: string) => {
  if (language.includes('British')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
  if (language.includes('Spanish')) return 'bg-red-500/20 text-red-700 dark:text-red-300'
  return 'bg-accent/20 text-accent dark:text-accent'
}

export function VideoGrid() {
  return (
    <section id="videos" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Featured Lessons</h2>
          <p className="text-lg text-foreground/60">Explore our collection of authentic video lessons across multiple languages and proficiency levels</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col border-border/50 hover:border-accent/30">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex gap-2 mb-2">
                    <Badge className={`text-xs ${languageBadgeVariant(video.language)}`}>
                      {video.language}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {video.duration}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-foreground/60 mb-3 flex-1">
                    {video.description}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {video.channel}
                  </p>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
