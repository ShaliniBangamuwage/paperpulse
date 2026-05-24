import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white">

      {/* Navbar */}
      <nav className="px-6 py-4 border-b dark:border-gray-800 border-orange-100 flex items-center justify-between max-w-7xl mx-auto">
        <span className="font-bold text-xl dark:text-white text-gray-900">
          Paper<span className="text-orange-500">Pulse</span>
        </span>
        <div className="flex gap-3">
          <Link href="/login"
            className="dark:text-gray-400 text-gray-500 hover:text-orange-500 text-sm transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link href="/signup"
            className="bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm px-4 py-2 rounded-full mb-8 font-medium">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          Free forever · No credit card needed
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight dark:text-white text-gray-900">
          Upload a paper.<br />
          <span className="text-orange-500">Get 3 project ideas</span> instantly.
        </h1>

        <p className="dark:text-gray-400 text-gray-500 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          PaperPulse reads academic research papers and generates concrete, buildable project ideas for CS students — powered by AI.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup"
            className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors inline-block shadow-lg shadow-orange-500/25">
            Start for free →
          </Link>
          <Link href="/login"
            className="dark:text-gray-400 text-gray-500 hover:text-orange-500 text-sm transition-colors px-4 py-4">
            Already have an account? Sign in
          </Link>
        </div>

        {/* Social proof */}
        <p className="dark:text-gray-600 text-gray-400 text-xs mt-10">
          Trusted by CS students at universities worldwide
        </p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '450M+', label: 'Research papers' },
            { value: '3', label: 'Ideas per paper' },
            { value: '< 30s', label: 'Generation time' },
          ].map(stat => (
            <div key={stat.label} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 text-center">
              <p className="text-2xl font-bold text-orange-500 mb-1">{stat.value}</p>
              <p className="dark:text-gray-400 text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="bg-orange-500/10 text-orange-500 text-xs px-3 py-1.5 rounded-full font-medium uppercase tracking-wider">
            How it works
          </span>
          <h2 className="text-3xl font-semibold mt-4 dark:text-white text-gray-900">
            From paper to project in seconds
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Upload a PDF',
              desc: 'Drop any academic research paper — IEEE, ACM, arXiv, or discover papers directly inside the app.',
              icon: '📄'
            },
            {
              step: '02',
              title: 'AI reads it',
              desc: 'Our AI extracts the core problem, methodology, open research gaps, and future work opportunities.',
              icon: '🧠'
            },
            {
              step: '03',
              title: 'Get project ideas',
              desc: 'Receive 3 concrete, buildable project ideas with tech stack, difficulty rating, and estimated timeline.',
              icon: '💡'
            },
          ].map((item, i) => (
            <div key={item.step} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 relative group hover:border-orange-500 transition-colors">
              <div className="absolute top-4 right-4 text-xs font-mono dark:text-gray-700 text-gray-300 font-bold">{item.step}</div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 text-lg group-hover:bg-orange-500/30 transition-colors">
                {item.icon}
              </div>
              <h3 className="dark:text-white text-gray-900 font-semibold text-lg mb-2">{item.title}</h3>
              <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="bg-orange-500/10 text-orange-500 text-xs px-3 py-1.5 rounded-full font-medium uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl font-semibold mt-4 dark:text-white text-gray-900">
            Everything you need to build
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Research Discovery', desc: 'Browse 450M+ real papers from Semantic Scholar by topic.' },
            { title: 'AI Idea Generation', desc: 'Get 3 buildable project ideas with tech stack and architecture.' },
            { title: 'Project Roadmap', desc: 'AI breaks your idea into phases with tasks and timelines.' },
            { title: 'Chat with Paper', desc: 'Ask the AI anything about the paper in a chat interface.' },
            { title: 'Project Tracker', desc: 'Track your builds with tasks, progress bars, and GitHub links.' },
            { title: 'Reading List', desc: 'Organize papers by status with personal notes.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5 hover:border-orange-500 transition-colors">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
              <div>
                <p className="font-medium dark:text-white text-gray-900 mb-1">{f.title}</p>
                <p className="dark:text-gray-400 text-gray-500 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4 dark:text-white text-gray-900">
            Ready to find your next project?
          </h2>
          <p className="dark:text-gray-400 text-gray-500 mb-8 text-lg">
            Join students using PaperPulse to turn research into reality.
          </p>
          <Link href="/signup"
            className="bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-xl text-lg font-medium transition-colors inline-block shadow-lg shadow-orange-500/25">
            Get started free →
          </Link>
          <p className="dark:text-gray-600 text-gray-400 text-xs mt-4">
            No credit card required · Free plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 border-orange-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-bold dark:text-white text-gray-900">
            Paper<span className="text-orange-500">Pulse</span>
          </span>
          <p className="dark:text-gray-500 text-gray-400 text-sm">
            Built for CS students · Powered by AI
          </p>
          <p className="dark:text-gray-600 text-gray-400 text-sm">© 2026 PaperPulse</p>
        </div>
      </footer>

    </div>
  )
}