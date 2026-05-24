'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('papers')
        .select('*, ideas(*)')
        .eq('id', id)
        .single()
      setPaper(data)
      setLoading(false)

      // Welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I've read **"${data?.title}"** and I'm ready to answer your questions about it. Ask me anything — methodology, findings, how to implement the ideas, or anything else!`,
        timestamp: new Date()
      }])
    }
    load()
  }, [id, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || thinking) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setThinking(true)

    try {
      const response = await fetch('/api/chat-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          paperTitle: paper?.title,
          paperAbstract: paper?.abstract,
          ideas: paper?.ideas?.map((i: any) => i.title) || [],
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to get response')
      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      }])
    } catch (error: any) {
      toast.error('Failed to get response')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble answering that. Please try again.',
        timestamp: new Date()
      }])
    }

    setThinking(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'What problem does this paper solve?',
    'Explain the methodology simply',
    'What are the key findings?',
    'How can I implement idea #1?',
    'What tech stack should I use?',
    'What are the limitations?',
  ]

  if (loading) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex flex-col">

      {/* Header */}
      <div className="border-b dark:border-gray-800 border-orange-100 px-6 py-4 flex items-center gap-4 dark:bg-gray-950 bg-white sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="dark:text-gray-400 text-gray-500 hover:text-orange-500 transition-colors text-sm">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h1 className="font-semibold dark:text-white text-gray-900 truncate text-sm">
              Chat with paper
            </h1>
          </div>
          <p className="text-xs dark:text-gray-500 text-gray-400 truncate">{paper?.title}</p>
        </div>
        <button
          onClick={() => setMessages([{
            role: 'assistant',
            content: `Hi! I've read **"${paper?.title}"** and I'm ready to answer your questions. Ask me anything!`,
            timestamp: new Date()
          }])}
          className="text-xs dark:text-gray-400 text-gray-500 hover:text-orange-500 transition-colors shrink-0">
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
              msg.role === 'assistant'
                ? 'bg-orange-500 text-white'
                : 'dark:bg-gray-700 bg-orange-100 dark:text-white text-orange-600'
            }`}>
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-tr-sm'
                : 'dark:bg-gray-900 bg-orange-50 dark:text-gray-200 text-gray-700 border dark:border-gray-800 border-orange-100 rounded-tl-sm'
            }`}>
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>
                  {line.startsWith('**') && line.endsWith('**')
                    ? <strong>{line.slice(2, -2)}</strong>
                    : line}
                </p>
              ))}
              <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-orange-200' : 'dark:text-gray-600 text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {thinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-sm shrink-0">
              🤖
            </div>
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
          <p className="text-xs dark:text-gray-500 text-gray-400 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-xs dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 dark:text-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t dark:border-gray-800 border-orange-100 px-4 py-4 dark:bg-gray-950 bg-white">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this paper..."
            rows={1}
            className="flex-1 dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none transition-colors placeholder:dark:text-gray-600 placeholder:text-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || thinking}
            className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-3 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            →
          </button>
        </div>
        <p className="text-xs dark:text-gray-600 text-gray-400 text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}