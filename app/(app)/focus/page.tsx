'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Wind, Palette, Quote, Brain, Coffee, Music, X } from 'lucide-react'

const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Research is to see what everybody else has seen, and think what nobody has thought. — Albert Szent-Györgyi",
  "The more I read, the more I acquire, the more certain I am that I know nothing. — Voltaire",
  "Science is not only a disciple of reason but also one of romance and passion. — Stephen Hawking",
  "The important thing is not to stop questioning. — Albert Einstein",
  "In the middle of every difficulty lies opportunity. — Albert Einstein",
  "It always seems impossible until it's done. — Nelson Mandela",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "Research is creating new knowledge. — Neil Armstrong",
  "Every expert was once a beginner. — Helen Hayes",
]

const BREATHING_PHASES = [
  { label: 'Inhale', duration: 4, color: 'text-blue-400' },
  { label: 'Hold', duration: 4, color: 'text-purple-400' },
  { label: 'Exhale', duration: 6, color: 'text-green-400' },
  { label: 'Hold', duration: 2, color: 'text-orange-400' },
]

const COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7',
  '#ef4444', '#eab308', '#06b6d4', '#ec4899',
  '#ffffff', '#6b7280', '#000000', '#d97706',
]

const BRUSH_SIZES = [2, 5, 10, 20]

const TRACKS = [
  { label: 'Lo-Fi Hip Hop', desc: 'Chill beats for studying', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', color: 'bg-blue-500/20 text-blue-400', duration: '6:12', category: 'focus' },
  { label: 'Ambient Focus', desc: 'Calm ambient for deep work', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', color: 'bg-purple-500/20 text-purple-400', duration: '7:45', category: 'focus' },
  { label: 'Upbeat Study', desc: 'Light music to keep energy up', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', color: 'bg-green-500/20 text-green-400', duration: '5:30', category: 'focus' },
  { label: 'Relaxing Piano', desc: 'Soft piano for focused reading', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', color: 'bg-orange-500/20 text-orange-400', duration: '8:20', category: 'focus' },
  { label: 'Electronic Flow', desc: 'Electronic beats for coding', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', color: 'bg-pink-500/20 text-pink-400', duration: '6:55', category: 'focus' },
  { label: 'Mental Calm', desc: 'Deep relaxation and stress relief', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', color: 'bg-teal-500/20 text-teal-400', duration: '9:10', category: 'relax' },
  { label: 'Meditation Flow', desc: 'Mindful breathing and meditation', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', color: 'bg-indigo-500/20 text-indigo-400', duration: '10:00', category: 'relax' },
]

type Track = {
  label: string
  desc: string
  src: string
  color: string
  duration: string
  category?: string
}

function TrackCard({
  track,
  isPlaying,
  onPlay,
  onStop,
  onDelete,
}: {
  track: Track
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  onDelete?: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.play().catch(() => {})
    } else {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [isPlaying])

  return (
    <div className={`dark:bg-gray-800 bg-gray-50 border rounded-2xl p-4 transition-all ${
      isPlaying ? 'dark:border-orange-500/50 border-orange-300' : 'dark:border-gray-700 border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${track.color}`}>
          <Music size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium dark:text-white text-gray-900 text-sm">{track.label}</p>
            {isPlaying && (
              <span className="flex gap-0.5 items-end h-4">
                {[1, 2, 3].map(b => (
                  <span key={b} className="w-1 bg-orange-500 rounded-full animate-pulse"
                    style={{ height: `${8 + b * 3}px`, animationDelay: `${b * 0.1}s` }} />
                ))}
              </span>
            )}
          </div>
          <p className="text-xs dark:text-gray-500 text-gray-400">{track.desc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {track.duration && (
            <span className="text-xs dark:text-gray-500 text-gray-400">{track.duration}</span>
          )}
          <button
            onClick={isPlaying ? onStop : onPlay}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isPlaying
                ? 'bg-orange-500 text-white'
                : 'dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-gray-600 hover:bg-orange-500 hover:text-white'
            }`}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          {onDelete && (
            <button onClick={onDelete}
              className="w-9 h-9 rounded-xl flex items-center justify-center dark:bg-gray-700 bg-gray-200 dark:text-gray-400 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <audio ref={audioRef} src={track.src} preload="none" loop />
    </div>
  )
}

export default function FocusPage() {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'breathing' | 'paint' | 'quote' | 'music'>('pomodoro')

  // Pomodoro
  const [pomMode, setPomMode] = useState<'work' | 'break'>('work')
  const [pomSeconds, setPomSeconds] = useState(25 * 60)
  const [pomRunning, setPomRunning] = useState(false)
  const [pomCycles, setPomCycles] = useState(0)

  // Breathing
  const [breathRunning, setBreathRunning] = useState(false)
  const [breathPhase, setBreathPhase] = useState(0)
  const [breathCount, setBreathCount] = useState(0)
  const [breathProgress, setBreathProgress] = useState(0)

  // Paint
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [painting, setPainting] = useState(false)
  const [color, setColor] = useState('#f97316')
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Quote
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)

  // Music
  const [customTracks, setCustomTracks] = useState<Track[]>([])
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)

  // ── Pomodoro ──────────────────────────────────────────
  useEffect(() => {
    if (!pomRunning) return
    const interval = setInterval(() => {
      setPomSeconds(s => {
        if (s <= 1) {
          clearInterval(interval)
          setPomRunning(false)
          if (pomMode === 'work') {
            setPomMode('break')
            setPomSeconds(5 * 60)
            setPomCycles(c => c + 1)
          } else {
            setPomMode('work')
            setPomSeconds(25 * 60)
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pomRunning, pomMode])

  function resetPomodoro() {
    setPomRunning(false)
    setPomMode('work')
    setPomSeconds(25 * 60)
  }

  function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const pomTotal = pomMode === 'work' ? 25 * 60 : 5 * 60
  const pomPercent = ((pomTotal - pomSeconds) / pomTotal) * 100

  // ── Breathing ──────────────────────────────────────────
  useEffect(() => {
    if (!breathRunning) return
    const phase = BREATHING_PHASES[breathPhase]
    let elapsed = 0
    const interval = setInterval(() => {
      elapsed++
      setBreathProgress((elapsed / phase.duration) * 100)
      if (elapsed >= phase.duration) {
        clearInterval(interval)
        const next = (breathPhase + 1) % BREATHING_PHASES.length
        setBreathPhase(next)
        setBreathProgress(0)
        if (next === 0) setBreathCount(c => c + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [breathRunning, breathPhase])

  // ── Paint ──────────────────────────────────────────────
  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function startPaint(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setPainting(true)
    lastPos.current = getPos(e)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!painting) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#111827' : color
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function clearCanvas() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function downloadCanvas() {
    const canvas = canvasRef.current!
    const link = document.createElement('a')
    link.download = 'paperpulse-art.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  useEffect(() => {
    if (activeTab === 'paint') {
      setTimeout(() => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#111827'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }, 100)
    }
  }, [activeTab])

  // ── Quote ──────────────────────────────────────────────
  function newQuote() {
    setQuoteVisible(false)
    setTimeout(() => {
      setQuoteIndex(Math.floor(Math.random() * QUOTES.length))
      setQuoteVisible(true)
    }, 300)
  }

  const tabs = [
    { id: 'pomodoro', label: 'Pomodoro', icon: Coffee },
    { id: 'breathing', label: 'Breathing', icon: Wind },
    { id: 'paint', label: 'Paint', icon: Palette },
    { id: 'quote', label: 'Quotes', icon: Quote },
    { id: 'music', label: 'Music', icon: Music },
  ] as const

  const focusTracks = TRACKS.filter(t => t.category === 'focus')
  const relaxTracks = TRACKS.filter(t => t.category === 'relax')

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 text-gray-900 dark:text-white p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain size={24} className="text-orange-500" />
            <h1 className="text-2xl font-semibold">Focus Room</h1>
          </div>
          <p className="dark:text-gray-400 text-gray-500 text-sm">
            Take a break, recharge, and come back stronger
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'dark:text-gray-400 text-gray-500 hover:text-orange-500'
                }`}>
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── POMODORO ── */}
        {activeTab === 'pomodoro' && (
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-8 text-center">
            <div className="mb-2">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                pomMode === 'work' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-400'
              }`}>
                {pomMode === 'work' ? 'Work Session' : 'Break Time'}
              </span>
            </div>

            <div className="relative w-48 h-48 mx-auto my-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none"
                  className="dark:stroke-gray-800 stroke-gray-200" strokeWidth="4" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={pomMode === 'work' ? '#f97316' : '#22c55e'}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - pomPercent / 100)}`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold dark:text-white text-gray-900 font-mono">
                  {formatTime(pomSeconds)}
                </span>
                <span className="text-xs dark:text-gray-500 text-gray-400 mt-1">
                  {pomMode === 'work' ? 'Focus' : 'Rest'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button onClick={() => setPomRunning(r => !r)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-colors">
                {pomRunning ? <Pause size={18} /> : <Play size={18} />}
                {pomRunning ? 'Pause' : 'Start'}
              </button>
              <button onClick={resetPomodoro}
                className="p-3 dark:bg-gray-800 bg-gray-100 rounded-xl dark:text-gray-400 text-gray-500 hover:text-orange-500 transition-colors">
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xl font-semibold text-orange-500">{pomCycles}</p>
                <p className="text-xs dark:text-gray-500 text-gray-400">Cycles done</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold dark:text-white text-gray-900">{pomCycles * 25}m</p>
                <p className="text-xs dark:text-gray-500 text-gray-400">Focus time</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => { setPomSeconds(25 * 60); setPomMode('work'); setPomRunning(false) }}
                className="py-2 dark:bg-gray-800 bg-gray-100 rounded-xl text-xs dark:text-gray-400 text-gray-500 hover:text-orange-500 transition-colors">
                25 min work
              </button>
              <button onClick={() => { setPomSeconds(5 * 60); setPomMode('break'); setPomRunning(false) }}
                className="py-2 dark:bg-gray-800 bg-gray-100 rounded-xl text-xs dark:text-gray-400 text-gray-500 hover:text-green-400 transition-colors">
                5 min break
              </button>
            </div>
          </div>
        )}

        {/* ── BREATHING ── */}
        {activeTab === 'breathing' && (
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-8 text-center">
            <p className="dark:text-gray-400 text-gray-500 text-sm mb-8">
              Box breathing — reduces stress and improves focus
            </p>

            <div className="relative w-56 h-56 mx-auto mb-8">
              <div
                className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ${
                  breathRunning
                    ? BREATHING_PHASES[breathPhase].label === 'Inhale'
                      ? 'border-blue-400 bg-blue-400/10'
                      : BREATHING_PHASES[breathPhase].label === 'Exhale'
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-purple-400 bg-purple-400/10'
                    : 'border-orange-500/30 bg-orange-500/5'
                }`}
                style={{
                  transform: breathRunning
                    ? BREATHING_PHASES[breathPhase].label === 'Inhale' ? 'scale(1.15)'
                    : BREATHING_PHASES[breathPhase].label === 'Exhale' ? 'scale(0.85)'
                    : 'scale(1)'
                    : 'scale(1)'
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {breathRunning ? (
                  <>
                    <span className={`text-2xl font-bold ${BREATHING_PHASES[breathPhase].color}`}>
                      {BREATHING_PHASES[breathPhase].label}
                    </span>
                    <span className="text-sm dark:text-gray-400 text-gray-500 mt-1">
                      {BREATHING_PHASES[breathPhase].duration}s
                    </span>
                    <div className="w-20 h-1 dark:bg-gray-800 bg-gray-200 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                        style={{ width: `${breathProgress}%` }} />
                    </div>
                  </>
                ) : (
                  <span className="text-lg dark:text-gray-400 text-gray-500">Ready</span>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              {BREATHING_PHASES.map((phase, i) => (
                <div key={i} className={`text-center px-3 py-2 rounded-xl transition-colors ${
                  breathRunning && breathPhase === i ? 'dark:bg-gray-800 bg-gray-100' : ''
                }`}>
                  <p className={`text-sm font-medium ${phase.color}`}>{phase.label}</p>
                  <p className="text-xs dark:text-gray-500 text-gray-400">{phase.duration}s</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setBreathRunning(r => !r)
                if (!breathRunning) { setBreathPhase(0); setBreathProgress(0) }
              }}
              className="flex items-center gap-2 mx-auto bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-colors">
              {breathRunning ? <Pause size={18} /> : <Wind size={18} />}
              {breathRunning ? 'Stop' : 'Start breathing'}
            </button>

            {breathCount > 0 && (
              <p className="text-sm dark:text-gray-400 text-gray-500 mt-4">
                {breathCount} cycle{breathCount > 1 ? 's' : ''} completed
              </p>
            )}
          </div>
        )}

        {/* ── PAINT ── */}
        {activeTab === 'paint' && (
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-5">
            <p className="text-sm dark:text-gray-400 text-gray-500 mb-4 text-center">
              Express yourself — draw anything you want
            </p>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => { setColor(c); setTool('brush') }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c && tool === 'brush' ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>

              <div className="flex gap-1.5 items-center">
                {BRUSH_SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)}
                    className={`rounded-full bg-orange-500 transition-all ${brushSize === s ? 'ring-2 ring-orange-300' : ''}`}
                    style={{ width: s * 2 + 8, height: s * 2 + 8 }} />
                ))}
              </div>

              <button onClick={() => setTool(t => t === 'eraser' ? 'brush' : 'eraser')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  tool === 'eraser'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500'
                }`}>
                Eraser
              </button>

              <div className="ml-auto flex gap-2">
                <button onClick={clearCanvas}
                  className="text-xs px-3 py-1.5 dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-500 rounded-lg hover:text-orange-500 transition-colors">
                  Clear
                </button>
                <button onClick={downloadCanvas}
                  className="text-xs px-3 py-1.5 bg-orange-500/20 text-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors">
                  Save
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={380}
              onMouseDown={startPaint}
              onMouseMove={draw}
              onMouseUp={() => { setPainting(false); lastPos.current = null }}
              onMouseLeave={() => { setPainting(false); lastPos.current = null }}
              onTouchStart={startPaint}
              onTouchMove={draw}
              onTouchEnd={() => { setPainting(false); lastPos.current = null }}
              className="w-full rounded-xl cursor-crosshair"
              style={{ background: '#111827', touchAction: 'none' }}
            />
          </div>
        )}

        {/* ── QUOTES ── */}
        {activeTab === 'quote' && (
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-8 text-center">
            <Quote size={32} className="text-orange-500 mx-auto mb-6" />

            <div className={`transition-opacity duration-300 ${quoteVisible ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-xl dark:text-white text-gray-900 font-medium leading-relaxed mb-4">
                "{QUOTES[quoteIndex].split(' — ')[0]}"
              </p>
              <p className="text-sm text-orange-500 font-medium">
                — {QUOTES[quoteIndex].split(' — ')[1]}
              </p>
            </div>

            <button onClick={newQuote}
              className="mt-8 flex items-center gap-2 mx-auto bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-xl font-medium transition-colors">
              <RotateCcw size={16} />
              New quote
            </button>

            <div className="mt-8 space-y-3 text-left max-h-64 overflow-y-auto">
              {QUOTES.map((q, i) => (
                <div key={i}
                  onClick={() => { setQuoteIndex(i); setQuoteVisible(true) }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors text-sm ${
                    i === quoteIndex
                      ? 'bg-orange-500/20 dark:text-white text-gray-900'
                      : 'dark:bg-gray-800 bg-gray-50 dark:text-gray-400 text-gray-500 hover:bg-orange-500/10'
                  }`}>
                  "{q.split(' — ')[0]}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MUSIC ── */}
        {activeTab === 'music' && (
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold dark:text-white text-gray-900">Focus Music</h2>
                <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Music to help you concentrate</p>
              </div>
              <button
                onClick={() => setShowAddTrack(s => !s)}
                className="flex items-center gap-2 text-xs bg-orange-500/20 text-orange-500 px-3 py-2 rounded-xl hover:bg-orange-500/30 transition-colors">
                <Music size={14} />
                Add your music
              </button>
            </div>

            {/* Add custom track */}
            {showAddTrack && (
              <div className="dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-200 rounded-2xl p-4 mb-5">
                <p className="text-sm font-medium dark:text-white text-gray-900 mb-3">Add your own track</p>
                <div className="space-y-2 mb-3">
                  <input
                    placeholder="Track name"
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    className="w-full dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-200 dark:text-white text-gray-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                  <input
                    placeholder="MP3 URL (e.g. https://example.com/music.mp3)"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    className="w-full dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-200 dark:text-white text-gray-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!customUrl.trim() || !customLabel.trim()) return
                      setCustomTracks(prev => [...prev, {
                        label: customLabel,
                        desc: 'Your custom track',
                        src: customUrl,
                        color: 'bg-orange-500/20 text-orange-500',
                        duration: '',
                      }])
                      setCustomUrl('')
                      setCustomLabel('')
                      setShowAddTrack(false)
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                    Add track
                  </button>
                  <button
                    onClick={() => setShowAddTrack(false)}
                    className="px-4 dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-gray-600 py-2 rounded-xl text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wider font-medium">
                Focus & Study
              </p>
              {focusTracks.map((track, i) => (
                <TrackCard
                  key={i}
                  track={track}
                  isPlaying={currentTrack === track.src}
                  onPlay={() => setCurrentTrack(track.src)}
                  onStop={() => setCurrentTrack(null)}
                />
              ))}

              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wider font-medium pt-2">
                Mental Relaxation
              </p>
              {relaxTracks.map((track, i) => (
                <TrackCard
                  key={i}
                  track={track}
                  isPlaying={currentTrack === track.src}
                  onPlay={() => setCurrentTrack(track.src)}
                  onStop={() => setCurrentTrack(null)}
                />
              ))}

              {customTracks.length > 0 && (
                <>
                  <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wider font-medium pt-2">
                    Your Music
                  </p>
                  {customTracks.map((track, i) => (
                    <TrackCard
                      key={i}
                      track={track}
                      isPlaying={currentTrack === track.src}
                      onPlay={() => setCurrentTrack(track.src)}
                      onStop={() => setCurrentTrack(null)}
                      onDelete={() => setCustomTracks(prev => prev.filter((_, j) => j !== i))}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}