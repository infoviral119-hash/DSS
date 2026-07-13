import { useHelpVideos } from '../hooks/useHelp'
import { HelpLoadState } from '../components/HelpLoadState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : url
}

export function HelpVideosPage() {
  const { data: videos = [], isLoading, isError, error } = useHelpVideos()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Bantuan / Video Tutorial</p>
        <h1 className="text-xl font-bold">Video Tutorial</h1>
      </div>
      <HelpLoadState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat video..."
        empty={videos.length === 0}
        emptyText="Belum ada video tutorial. Admin dapat menambah via CMS Bantuan."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((v) => (
            <Card key={v.id}>
              <div className="aspect-video">
                <iframe
                  title={v.title}
                  src={youtubeEmbed(v.youtube_url)}
                  className="h-full w-full rounded-t-lg"
                  allowFullScreen
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{v.title}</CardTitle>
                {v.duration && <p className="text-xs text-muted-foreground">{v.duration}</p>}
              </CardHeader>
              {v.category && <CardContent className="pt-0 text-xs text-muted-foreground">{v.category}</CardContent>}
            </Card>
          ))}
        </div>
      </HelpLoadState>
    </div>
  )
}
