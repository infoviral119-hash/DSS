import { useState, useEffect } from 'react'
import { Bot, Loader2, Send, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAiLlmNarrative, useAiLlmStatus, useAiChat } from '@/features/ai-insight/hooks/useAiLlm'
import { ConfidenceIndicator } from '@/features/ai-insight/components/ConfidenceIndicator'

interface LlmNarrativePanelProps {
  fallbackBrief: string
  onBriefUpgrade?: (brief: string) => void
}

export function LlmNarrativePanel({ fallbackBrief, onBriefUpgrade }: LlmNarrativePanelProps) {
  const { data: status } = useAiLlmStatus()
  const llmEnabled = Boolean(status?.enabled)
  const { data: llm, isLoading, isError } = useAiLlmNarrative(llmEnabled)
  const chat = useAiChat()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])

  useEffect(() => {
    if (llm?.executiveBrief && llm.executiveBrief !== fallbackBrief) {
      onBriefUpgrade?.(llm.executiveBrief)
    }
  }, [llm?.executiveBrief, fallbackBrief, onBriefUpgrade])

  const handleAsk = async () => {
    if (!question.trim()) return
    const q = question.trim()
    setQuestion('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    const res = await chat.mutateAsync(q)
    setMessages((m) => [...m, { role: 'ai', text: res.reply }])
  }

  if (!llmEnabled) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Bot className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">LLM Tahap 2 — belum aktif</p>
            <p className="text-xs">Set OPENAI_API_KEY di backend .env lalu restart.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          LLM sedang menyusun narasi eksekutif...
        </CardContent>
      </Card>
    )
  }

  if (isError || !llm) return null

  return (
    <div className="space-y-4">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-transparent dark:from-violet-950/20">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-violet-600" />
              AI Narrative (LLM — {llm.provider}/{llm.model})
            </CardTitle>
            <ConfidenceIndicator value={llm.confidence} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {llm.error && <p className="text-xs text-amber-700">Fallback rule-based: {llm.error}</p>}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Ringkasan LLM</p>
            <ul className="space-y-1">
              {llm.executiveSummary.map((line, i) => (
                <li key={i} className="text-sm">{line}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{llm.narrative}</p>
          {llm.riskAssessment && (
            <p className="rounded bg-muted/50 p-2 text-xs"><strong>Risiko:</strong> {llm.riskAssessment}</p>
          )}
          {llm.actionPriority && (
            <p className="text-xs"><strong>Prioritas:</strong> {llm.actionPriority}</p>
          )}
          {llm.strategicRecommendations.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Rekomendasi Strategis</p>
              <ul className="space-y-0.5">
                {llm.strategicRecommendations.map((r) => (
                  <li key={r} className="text-xs">• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4" />
            Tanya AI (kontekstual)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">Contoh: Wilayah mana yang paling mendesak?</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`rounded-lg p-2 text-xs ${m.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-muted/50 mr-8'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Pertanyaan untuk pimpinan..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              className="h-9 text-sm"
            />
            <Button size="sm" className="h-9 shrink-0" onClick={handleAsk} disabled={chat.isPending}>
              {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
