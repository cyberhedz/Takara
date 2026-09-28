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
import MicIcon from '@mui/icons-material/Mic'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import ReactMarkdown from 'react-markdown'

export type ChatContext = {
  name: string
  classification?: string
} | null

type Message = { role: 'user' | 'assistant'; content: string }

const STARTERS = ['What food pairs with this?', "What's the difference between junmai and ginjo?", 'Serve warm or chilled?']

// Strips markdown syntax the assistant's replies use (bold, headings, list
// dashes) so SpeechSynthesis reads plain sentences instead of literal
// asterisks and hashes.
function toSpeechText(markdown: string) {
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n+/g, '. ')
    .trim()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function ChatAssistant({ context, navVisible }: { context: ChatContext; navVisible: boolean }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const micSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window !== 'undefined' && 'MediaRecorder' in window

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Stop talking if the panel closes or unmounts mid-reply.
  useEffect(() => {
    if (!open && speechSupported) window.speechSynthesis.cancel()
  }, [open, speechSupported])
  useEffect(() => () => { if (speechSupported) window.speechSynthesis.cancel() }, [speechSupported])

  const contextLabel = context ? [context.name, context.classification].filter(Boolean).join(' · ') : null

  function speak(markdown: string) {
    if (!speakReplies || !speechSupported) return
    const text = toSpeechText(markdown)
    if (!text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

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
        speak(data.message)
      }
    } catch {
      setError('Unable to reach the assistant. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true)
    setError(null)
    try {
      const audio = await blobToBase64(blob)
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio, mimeType: blob.type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Could not transcribe that clip.')
        return
      }
      if (!data.text) {
        setError("Didn't catch that — try holding the mic button a little longer.")
        return
      }
      send(data.text)
    } catch {
      setError('Unable to reach the transcription service.')
    } finally {
      setTranscribing(false)
    }
  }

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        transcribe(blob)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      setError('Microphone access was blocked. Check your browser permissions and try again.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
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
            {speechSupported && (
              <IconButton
                onClick={() => setSpeakReplies((v) => !v)}
                size="small"
                sx={{ color: '#fff', opacity: speakReplies ? 1 : 0.65 }}
                aria-label={speakReplies ? 'Turn off spoken replies' : 'Read replies aloud'}
                aria-pressed={speakReplies}
              >
                {speakReplies ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
              </IconButton>
            )}
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
                  {micSupported ? ' Type, or hold the mic to ask out loud.' : ''}
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
              {transcribing && (
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', px: 0.5, fontStyle: 'italic' }}>
                  Listening back…
                </Typography>
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
            {micSupported && (
              <IconButton
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (!loading && !transcribing) startRecording()
                }}
                onPointerUp={() => recording && stopRecording()}
                onPointerLeave={() => recording && stopRecording()}
                onPointerCancel={() => recording && stopRecording()}
                disabled={loading || transcribing}
                aria-label={recording ? 'Recording — release to send' : 'Hold to ask out loud'}
                sx={{
                  bgcolor: recording ? 'error.main' : 'background.default',
                  color: recording ? '#fff' : 'text.secondary',
                  border: '1px solid',
                  borderColor: recording ? 'error.main' : 'divider',
                  '&:hover': { bgcolor: recording ? 'error.main' : 'background.default' },
                  animation: recording ? 'pulse 1.1s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(211,47,47,0.4)' },
                    '50%': { boxShadow: '0 0 0 6px rgba(211,47,47,0)' },
                  },
                }}
              >
                {transcribing ? <CircularProgress size={18} thickness={5} sx={{ color: 'text.secondary' }} /> : <MicIcon fontSize="small" />}
              </IconButton>
            )}
            <InputBase
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? 'Listening…' : 'Ask about this sake…'}
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
