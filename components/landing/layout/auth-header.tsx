import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { FadeInView } from '@/components/animations'

interface AuthHeaderProps {
  title: string
  description: string
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <FadeInView delay={0.1}>
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Jokko</span>
        </Link>
      </FadeInView>

      <FadeInView delay={0.2}>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </FadeInView>
    </div>
  )
}
