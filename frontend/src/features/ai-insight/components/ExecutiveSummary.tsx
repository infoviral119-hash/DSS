import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ExecutiveSummary({ lines }: { lines: string[] }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {lines.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground">{line}</p>
        ))}
      </CardContent>
    </Card>
  )
}
