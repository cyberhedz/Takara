import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ReactMarkdown from 'react-markdown'

export type ChatContext = {
  name: string
  classification?: string
} | null

type Message = { role: 'user' | 'assistant'; content: string }

const STARTERS = ['What food pairs with this?', "What's the difference between junmai and ginjo?", 'Serve warm or chilled?']

export default function ChatAssistant({ context, navVisible }: { context: ChatContext; navVisible: boolean }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const contextLabel = context ? [context.name, context.classification].filter(Boolean).join(' · ') : null

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          context: contextLabel,
          history: nextMessages.slice(0, -1),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Something went wrong.')
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setError('Unable to reach the assistant. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const bottomOffset = navVisible ? 104 : 20

  return (
    <Box sx={{ position: 'fixed', left: '50%', bottom: 0, width: 'min(100%, 540px)', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 1300 }}>
      {!open && (
        <Fab
          aria-label="Ask the sake assistant"
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            right: 16,
            bottom: bottomOffset,
            pointerEvents: 'auto',
            bgcolor: 'secondary.main',
            color: '#fff',
            '&:hover': { bgcolor: 'secondary.main', opacity: 0.9 },
          }}
        >
          <AutoAwesomeIcon />
        </Fab>
      )}

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            right: 0,
            left: 0,
            bottom: 0,
            mx: { xs: 0, sm: 1 },
            pointerEvents: 'auto',
            borderRadius: '20px 20px 0 0',
            display: 'flex',
            flexDirection: 'column',
            height: 'min(72vh, 560px)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: 'center', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'secondary.main', color: '#fff' }}
          >
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Sake assistant</Typography>
              <Typography sx={{ fontSize: 11.5, opacity: 0.8, lineHeight: 1.2 }} noWrap>
                {contextLabel ? `Asking about ${contextLabel}` : 'Ask about styles, pairings, or what to try next'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: '#fff' }} aria-label="Close chat">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, bgcolor: 'background.default' }}>
            {messages.length === 0 && (
              <Stack spacing={1.5}>
                <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                  {contextLabel
                    ? `I can help with anything about ${context?.name} — or sake in general.`
                    : "I'm here for anything about tonight's pours — styles, pairings, serving temperature."}
                </Typography>
                <Stack spacing={1}>
                  {STARTERS.map((s) => (
                    <Paper
                      key={s}
                      onClick={() => send(s)}
                      sx={{
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '12px',
                        fontSize: 13.5,
                        bgcolor: 'background.paper',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      {s}
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            )}

            <Stack spacing={1.5}>
              {messages.map((m, i) => (
                <Box
                  key={i}
                  sx={{
                    maxWidth: '85%',
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper',
                    color: m.role === 'user' ? '#fff' : 'text.primary',
                    border: m.role === 'user' ? 'none' : '1px solid',
                    borderColor: 'divider',
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    px: 1.5,
                    py: 1,
                    fontSize: 14,
                    lineHeight: 1.55,
                    '& p': { margin: 0 },
                    '& p + p': { marginTop: '0.5em' },
                  }}
                >
                  {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                </Box>
              ))}
              {loading && (
                <Box sx={{ alignSelf: 'flex-start', px: 1.5, py: 1 }}>
                  <CircularProgress size={16} thickness={5} sx={{ color: 'text.secondary' }} />
                </Box>
              )}
              {error && (
                <Typography sx={{ fontSize: 12.5, color: 'error.main', px: 0.5 }}>{error}</Typography>
              )}
            </Stack>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <InputBase
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this sake…"
              sx={{
                flex: 1,
                fontSize: 14,
                px: 1.5,
                py: 1,
                bgcolor: 'background.default',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <IconButton type="submit" disabled={!input.trim() || loading} sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.main', opacity: 0.9 }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
