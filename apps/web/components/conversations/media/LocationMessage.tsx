import Image from 'next/image'
import { MapPin } from 'lucide-react'
import type { Message } from '@/hooks/useMessages'

export function LocationMessage({ message }: { message: Message }) {
    if (!message.latitude || !message.longitude) return null

    const googleMapsUrl = `https://www.google.com/maps?q=${message.latitude},${message.longitude}`

    return (
        <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl overflow-hidden max-w-[280px]"
        >
            <div className="h-[150px] bg-gray-200 relative">
                <Image
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.latitude},${message.longitude}&zoom=15&size=280x150&markers=color:red%7C${message.latitude},${message.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}`}
                    alt="Location"
                    width={280}
                    height={150}
                    className="object-cover w-full h-full"
                />
            </div>
            <div className="p-2 bg-white/80">
                <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="truncate">{message.locationName || message.locationAddress || 'Voir sur la carte'}</span>
                </div>
            </div>
        </a>
    )
}
