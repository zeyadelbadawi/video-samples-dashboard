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
  },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-full overflow-x-auto">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Video Samples Data</h1>
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-primary text-primary-foreground">
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
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-muted/50">
                <td className="border border-border px-4 py-2 text-foreground">{row.case_id}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.source_platform}</td>
                <td className="border border-border px-4 py-2 text-foreground">{row.video_title}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
