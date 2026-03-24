'use client'

const data = [
  {
    case_id: 'british_01',
    source_platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=QCvJMTSzGPo',
    video_title: 'Real British English Conversations in a Small Town (with Subtitles)',
    channel: 'My English Coach Dave',
    start_sec: 0,
    end_sec: 30,
    duration_sec: 30,
    detected_language: 'English',
    primary_language: 'English',
    multilingual: 'FALSE',
    language_tags: 'English',
    audio_type: 'Speech',
    visual_type: 'Multi-shots',
    voice_over: 'No',
    transcript: "Hello everyone today we're going on a trip and I'm going to take you to a very special place in Derbyshire, it's a place... I used to go to a lot as a child by the way, Don't worry. I'm not driving. My wife's driving. Um, can I say hi? Look at the little wave. That's gin driving, carefully. Um... Anyway, yeah, we're going to take you to bake well",
    video_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/british_01-T95h3etepM67gvzIVvrWPm4XMKUQqM.mp4',
  },
  {
    case_id: 'british_02',
    source_platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=5Rde32zipGk',
    video_title: 'British Accent Shadowing | Pride and Prejudice | Learn RP Pronunciation Part 1',
    channel: 'Ashley Howard',
    start_sec: 23,
    end_sec: 42,
    duration_sec: 19,
    detected_language: 'English',
    primary_language: 'English',
    multilingual: 'FALSE',
    language_tags: 'English',
    audio_type: 'Speech',
    visual_type: 'Single-shot',
    voice_over: 'Yes',
    transcript: "I'll begin by reading the passage in full, then we'll go line by line so you can repeat after me, and build clarity, fluency, and confidence in your spoken English. There's also a free PDF of today's text. linked in the description box below if you'd like to follow along, okay?",
    video_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/british_02-OiidXzIz59LKdw3IFjBaQAvqMaG87s.mp4',
  },
  {
    case_id: 'spanish_01',
    source_platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=vRMAc1UgW-w',
    video_title: 'Interview in Spanish - Meet Paul | Spanish Listening Activity',
    channel: 'Why Not Spanish?',
    start_sec: 15,
    end_sec: 29,
    duration_sec: 14,
    detected_language: 'Spanish',
    primary_language: 'Spanish',
    multilingual: 'FALSE',
    language_tags: 'Spanish',
    audio_type: 'Speech',
    visual_type: 'Single-shot',
    voice_over: 'No',
    transcript: 'será en español, pero antes de escucharla vamos a conocer algunas de las palabras que vamos a escuchar para que te familiarices con ellas. Al final de la conversación... escucharemos unas preguntas de verdadero o falso.',
    video_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spanish_01-VDvo6ulEos2nP9Pg8uo6UWDiOe4IHB.mp4',
  },
  {
    case_id: 'spanish_02',
    source_platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=GGqcpDSUJlE',
    video_title: 'Gipsy Kings - Bamboléo (Official Lyric Video)',
    channel: 'Gipsy Kings',
    start_sec: 20,
    end_sec: 30,
    duration_sec: 10,
    detected_language: 'Spanish',
    primary_language: 'Spanish',
    multilingual: 'FALSE',
    language_tags: 'Spanish',
    audio_type: 'Singing',
    visual_type: 'Single-shot',
    voice_over: 'Yes',
    transcript: 'Caballo de danza vana porque es muy despreciado, No te perdono llorar',
    video_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spanish_02-h6xF4j0pJXo0PTQQFOmvx1jbRFwyrl.mp4',
  },
  {
    case_id: 'american_01',
    source_platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=HAnw168huqA',
    video_title: 'Think Fast, Talk Smart: Communication Techniques',
    channel: 'Stanford Graduate School of Business',
    start_sec: 115,
    end_sec: 120,
    duration_sec: 5,
    detected_language: 'English',
    primary_language: 'English',
    multilingual: 'FALSE',
    language_tags: 'English',
    audio_type: 'Speech',
    visual_type: 'Single-shot',
    voice_over: 'No',
    transcript: 'I do this because this is a perfect analogy for what we\'re going to be talking about today.',
    video_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/american_01-fUlW63t1HUUOiAoptRZ9V7TOuVuexV.mp4',
  },
  {
    case_id: 'american_02',
    source_platform: 'YouTube',
    source_url: 'https://www.youtube.com/watch?v=5oTmkLZcFxE',
    video_title: 'Very Simple Spanish Story for Beginners (A1–A2) – My Perfect Day',
    channel: 'ListenES',
    start_sec: 0,
    end_sec: 30,
    duration_sec: 30,
    detected_language: 'English',
    primary_language: 'English',
    multilingual: 'TRUE',
    language_tags: 'English, Spanish',
    audio_type: 'Speech',
    visual_type: 'Multi-shots',
    voice_over: 'Yes',
    transcript: 'In this lesson, we will listen to one simple story in Spanish. It is perfect for all beginners. We will start by listening to the text with subtitles. Then we\'ll go through the part of the text with translation. Finally, we will listen to the text again without subtitles and without translation, and answer the questions. Mi día perfecto. Me llamo Liam. Tengo veinticuatro años. Hoy quiero contarte sobre mi día.',
    video_url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/american_01-fUlW63t1HUUOiAoptRZ9V7TOuVuexV.mp4',
  },
]

interface VideoPlayerProps {
  videoUrl: string
  startTime: number
  endTime: number
  caseId: string
}

function VideoPlayer({ videoUrl, startTime, endTime, caseId }: VideoPlayerProps) {
  return (
    <div className="flex flex-col gap-2">
      <video
        key={caseId}
        width={200}
        height={112}
        controls
        className="rounded bg-muted"
        controlsList="nodownload"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="text-xs text-muted-foreground">
        {startTime}s - {endTime}s
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-full overflow-x-auto">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Video Samples Data</h1>
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="sticky top-0 bg-primary text-primary-foreground">
              <th className="border border-border px-4 py-2 text-left font-semibold">Case ID</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Platform</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Video Title</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Channel</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Start (s)</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">End (s)</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Duration (s)</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Detected Lang</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Primary Lang</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Multilingual</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Language Tags</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Audio Type</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Visual Type</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Voice Over</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Transcript</th>
              <th className="border border-border px-4 py-2 text-left font-semibold">Cropped Video</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-muted/50">
                <td className="border border-border px-4 py-2 text-foreground">{row.case_id}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.source_platform}</td>
                <td className="border border-border px-4 py-2 text-foreground max-w-xs">{row.video_title}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.channel}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.start_sec}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.end_sec}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.duration_sec}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.detected_language}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.primary_language}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.multilingual}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.language_tags}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.audio_type}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.visual_type}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.voice_over}</td>
                <td className="border border-border px-4 py-2 text-foreground max-w-sm text-sm">{row.transcript}</td>
                <td className="border border-border px-4 py-2 text-foreground">
                  <VideoPlayer
                    videoUrl={row.video_url}
                    startTime={row.start_sec}
                    endTime={row.end_sec}
                    caseId={row.case_id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
