import Image from 'next/image'

export function StickerMessage({ url }: { url: string | null }) {
    if (!url) return null

    return (
        <div className="max-w-[180px]">
            <Image
                src={url}
                alt="Sticker"
                width={180}
                height={180}
                className="object-contain"
            />
        </div>
    )
}
