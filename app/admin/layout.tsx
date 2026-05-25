export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white">
      {children}
    </div>
  )
}