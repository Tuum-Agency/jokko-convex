import Link from 'next/link'
import { MessageCircle, Twitter, Linkedin, Github } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { FadeInView, StaggerContainer, StaggerItem } from '@/components/animations'

const footerLinks = {
    product: [
        { name: 'Fonctionnalités', href: '/fonctionnalites' },
        { name: 'Tarifs', href: '/tarifs' },
        { name: 'Intégrations', href: '/integrations' },
        { name: 'API', href: '/api' },
    ],
    company: [
        { name: 'À Propos', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Carrières', href: '/careers' },
        { name: 'Contact', href: '/contact' },
    ],
    resources: [
        { name: 'Documentation', href: '/docs' },
        { name: 'Centre d\'Aide', href: '/help' },
        { name: 'Communauté', href: '/community' },
        { name: 'Statut', href: '/status' },
    ],
    legal: [
        { name: 'Politique de Confidentialité', href: '/privacy' },
        { name: 'Conditions d\'Utilisation', href: '/terms' },
        { name: 'Politique des Cookies', href: '/cookies' },
        { name: 'RGPD', href: '/gdpr' },
    ],
}

const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'GitHub', href: '#', icon: Github },
]

export function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
                    {/* Brand Section */}
                    <FadeInView delay={0.2} className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">Jokko</span>
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-sm">
                            Transformez vos communications WhatsApp Business avec l&apos;automatisation alimentée par IA et les outils de collaboration d&apos;équipe.
                        </p>
                        <StaggerContainer staggerDelay={0.1} delayChildren={0.5}>
                            <div className="flex space-x-4">
                                {socialLinks.map((social) => {
                                    const Icon = social.icon
                                    return (
                                        <StaggerItem key={social.name}>
                                            <a
                                                href={social.href}
                                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                                                aria-label={social.name}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </a>
                                        </StaggerItem>
                                    )
                                })}
                            </div>
                        </StaggerContainer>
                    </FadeInView>

                    {/* Product Links */}
                    <FadeInView delay={0.4}>
                        <h3 className="text-white font-semibold mb-4">Produit</h3>
                        <StaggerContainer staggerDelay={0.05} delayChildren={0.1}>
                            <ul className="space-y-3">
                                {footerLinks.product.map((link) => (
                                    <StaggerItem key={link.name}>
                                        <li>
                                            <Link
                                                href={link.href}
                                                className="text-gray-400 hover:text-green-400 transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    </StaggerItem>
                                ))}
                            </ul>
                        </StaggerContainer>
                    </FadeInView>

                    {/* Company Links */}
                    <FadeInView delay={0.5}>
                        <h3 className="text-white font-semibold mb-4">Entreprise</h3>
                        <StaggerContainer staggerDelay={0.05} delayChildren={0.1}>
                            <ul className="space-y-3">
                                {footerLinks.company.map((link) => (
                                    <StaggerItem key={link.name}>
                                        <li>
                                            <Link
                                                href={link.href}
                                                className="text-gray-400 hover:text-green-400 transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    </StaggerItem>
                                ))}
                            </ul>
                        </StaggerContainer>
                    </FadeInView>

                    {/* Resources Links */}
                    <FadeInView delay={0.6}>
                        <h3 className="text-white font-semibold mb-4">Ressources</h3>
                        <StaggerContainer staggerDelay={0.05} delayChildren={0.1}>
                            <ul className="space-y-3">
                                {footerLinks.resources.map((link) => (
                                    <StaggerItem key={link.name}>
                                        <li>
                                            <Link
                                                href={link.href}
                                                className="text-gray-400 hover:text-green-400 transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    </StaggerItem>
                                ))}
                            </ul>
                        </StaggerContainer>
                    </FadeInView>

                    {/* Legal Links */}
                    <FadeInView delay={0.7}>
                        <h3 className="text-white font-semibold mb-4">Légal</h3>
                        <StaggerContainer staggerDelay={0.05} delayChildren={0.1}>
                            <ul className="space-y-3">
                                {footerLinks.legal.map((link) => (
                                    <StaggerItem key={link.name}>
                                        <li>
                                            <Link
                                                href={link.href}
                                                className="text-gray-400 hover:text-green-400 transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    </StaggerItem>
                                ))}
                            </ul>
                        </StaggerContainer>
                    </FadeInView>
                </div>

                <FadeInView delay={0.8}>
                    <Separator className="my-8 bg-gray-800" />
                </FadeInView>

                {/* Bottom Section */}
                <FadeInView delay={1.0}>
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-gray-400 text-sm">
                            © 2024 Jokko. Tous droits réservés.
                        </div>
                        <div className="flex flex-wrap gap-3 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                            <div className="h-6 px-2 rounded bg-white/10 flex items-center text-[10px] font-bold tracking-wider text-white border border-white/10">VISA</div>
                            <div className="h-6 px-2 rounded bg-white/10 flex items-center text-[10px] font-bold tracking-wider text-white border border-white/10">MASTERCARD</div>
                            <div className="h-6 px-2 rounded bg-orange-500/20 flex items-center text-[10px] font-bold tracking-wider text-orange-400 border border-orange-500/20">ORANGE</div>
                            <div className="h-6 px-2 rounded bg-blue-500/20 flex items-center text-[10px] font-bold tracking-wider text-blue-400 border border-blue-500/20">WAVE</div>
                            <div className="h-6 px-2 rounded bg-red-500/20 flex items-center text-[10px] font-bold tracking-wider text-red-500 border border-red-500/20">FREE</div>
                        </div>
                    </div>
                </FadeInView>
            </div>
        </footer>
    )
}
