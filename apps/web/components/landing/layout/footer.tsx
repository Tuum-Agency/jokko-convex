import Link from 'next/link'
import { MessageCircle, Twitter, Linkedin, Github } from 'lucide-react'

const footerLinks = {
    product: [
        { name: 'Boîte de réception', href: '/fonctionnalites' },
        { name: 'Campagnes Marketing', href: '/fonctionnalites' },
        { name: 'Chatbot & IA', href: '/fonctionnalites' },
        { name: 'CRM WhatsApp', href: '/fonctionnalites' },
        { name: 'Tarifs', href: '/tarifs' },
    ],
    solutions: [
        { name: 'Pour le E-commerce', href: '/solutions/e-commerce' },
        { name: 'Pour le Service Client', href: '/solutions/service-client' },
        { name: 'Pour les Agences', href: '/solutions/agences' },
        { name: 'TPE & PME', href: '/solutions/tpe-pme' },
    ],
    company: [
        { name: 'À Propos', href: '/' },
        { name: 'Contact', href: '/contact' },
        { name: 'Se connecter', href: '/auth/sign-in' },
        { name: 'S\'inscrire', href: '/auth/sign-up' },
    ],
    legal: [
        { name: 'Conditions d\'Utilisation', href: '/terms' },
        { name: 'Politique de Confidentialité', href: '/privacy' },
        { name: 'Mentions Légales', href: '/legal' },
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">Jokko</span>
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-sm">
                            Transformez vos communications WhatsApp Business avec l&apos;automatisation alimentée par IA et les outils de collaboration d&apos;équipe.
                        </p>
                        <div className="flex space-x-4 mb-6">
                            {socialLinks.map((social) => {
                                const Icon = social.icon
                                return (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                                        aria-label={social.name}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                )
                            })}
                        </div>
                        <div className="inline-flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1.5 border border-gray-700">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-300 font-medium">Nous utilisons l'API officielle WhatsApp Business</span>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Produit</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-green-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Entreprise</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-green-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Solutions Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Solutions</h3>
                        <ul className="space-y-3">
                            {footerLinks.solutions.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-green-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal & Help Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Aide & Légal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-green-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800">
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
                </div>
            </div>
        </footer>
    )
}
