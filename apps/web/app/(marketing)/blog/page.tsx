import type { Metadata } from 'next'
import { BlogHero } from '@/components/landing/sections/blog/blog-hero'
import { BlogFeatured } from '@/components/landing/sections/blog/blog-featured'
import { BlogGrid } from '@/components/landing/sections/blog/blog-grid'
import { BlogNewsletter } from '@/components/landing/sections/blog/blog-newsletter'

export const metadata: Metadata = {
    title: 'Blog — Jokko',
    description:
        'Retours terrain, études chiffrées, tutoriels pratiques sur la relation client WhatsApp. Un article par semaine, sans remplissage.',
}

export default function BlogPage() {
    return (
        <>
            <BlogHero />
            <BlogFeatured />
            <BlogGrid />
            <BlogNewsletter />
        </>
    )
}
