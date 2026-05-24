import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="px-6 py-4 border-b border-gray-800 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-white font-bold text-xl">
          Paper<span className="text-indigo-400">Pulse</span>
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm px-4 py-2 rounded-full mb-8">
          Free forever · No credit card needed
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Upload a paper.<br />
          <span className="text-indigo-400">Get 3 project ideas</span> instantly.
        </h1>
        <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
          PaperPulse reads academic research papers and generates concrete, buildable project ideas for CS students — powered by AI.
        </p>
        <Link href="/signup"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors inline-block">
          Start for free →
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-semibold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload a PDF', desc: 'Drop any academic research paper — IEEE, ACM, arXiv, anything.' },
            { step: '02', title: 'AI reads it', desc: 'Our AI extracts the core problem, methodology, and open research gaps.' },
            { step: '03', title: 'Get project ideas', desc: 'Receive 3 concrete, buildable project ideas with tech stack and timeline.' },
          ].map(item => (
            <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-indigo-400 font-bold text-sm mb-3">{item.step}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold mb-4">Ready to find your next project?</h2>
        <p className="text-gray-400 mb-8">Join students using PaperPulse to turn research into reality.</p>
        <Link href="/signup"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors inline-block">
          Get started free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-6 text-center text-gray-500 text-sm">
        © 2026 PaperPulse · Built for CS students
      </footer>
    </div>
  )
}