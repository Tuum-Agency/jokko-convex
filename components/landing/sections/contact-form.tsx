'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Send, CheckCircle, Loader2, User, Mail, Building, Phone, MessageSquare, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
    name: string
    email: string
    company: string
    phone: string
    subject: string
    message: string
}

export function ContactForm() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [errors, setErrors] = useState<Partial<FormData>>({})

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Clear error when user starts typing
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Le nom est requis'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'L\'email est requis'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'L\'email n\'est pas valide'
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Le sujet est requis'
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Le message est requis'
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Le message doit contenir au moins 10 caractères'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)

        try {
            // Simuler l'envoi du formulaire
            await new Promise(resolve => setTimeout(resolve, 2000))

            // En réalité, ici on ferait l'appel API
            console.log('Form data:', formData)

            setIsSubmitted(true)
        } catch (error) {
            console.error('Error submitting form:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            company: '',
            phone: '',
            subject: '',
            message: ''
        })
        setIsSubmitted(false)
        setErrors({})
    }

    if (isSubmitted) {
        return (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Message envoyé avec succès !
                </h3>
                <p className="text-gray-600 mb-6">
                    Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                </p>
                <Button
                    onClick={resetForm}
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                >
                    Envoyer un autre message
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom complet <span className="text-red-500">*</span></Label>
                        <InputGroup className={errors.name ? 'border-red-500 focus-within:border-red-500' : ''}>
                            <InputGroupAddon>
                                <User className="w-5 h-5" />
                            </InputGroupAddon>
                            <InputGroupInput
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Votre nom complet"
                                aria-required="true"
                                aria-invalid={!!errors.name}
                            />
                        </InputGroup>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                        <InputGroup className={errors.email ? 'border-red-500 focus-within:border-red-500' : ''}>
                            <InputGroupAddon>
                                <Mail className="w-5 h-5" />
                            </InputGroupAddon>
                            <InputGroupInput
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="votre@email.com"
                                aria-required="true"
                                aria-invalid={!!errors.email}
                            />
                        </InputGroup>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                </div>

                {/* Company & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">Entreprise</Label>
                        <InputGroup>
                            <InputGroupAddon>
                                <Building className="w-5 h-5" />
                            </InputGroupAddon>
                            <InputGroupInput
                                type="text"
                                id="company"
                                name="company"
                                value={formData.company}
                                onChange={handleInputChange}
                                placeholder="Votre entreprise (optionnel)"
                            />
                        </InputGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <InputGroup>
                            <InputGroupAddon>
                                <Phone className="w-5 h-5" />
                            </InputGroupAddon>
                            <InputGroupInput
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+33 1 23 45 67 89"
                            />
                        </InputGroup>
                    </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                    <Label htmlFor="subject">Sujet <span className="text-red-500">*</span></Label>
                    <InputGroup className={errors.subject ? 'border-red-500 focus-within:border-red-500' : ''}>
                        <InputGroupAddon>
                            <MessageSquare className="w-5 h-5" />
                        </InputGroupAddon>
                        <div className="relative w-full">
                            <select
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                className="flex h-full w-full bg-transparent px-3 py-1 text-sm font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                                aria-required="true"
                                aria-invalid={!!errors.subject}
                            >
                                <option value="" disabled>Sélectionnez un sujet</option>
                                <option value="demo">Demande de démonstration</option>
                                <option value="pricing">Question sur les tarifs</option>
                                <option value="technical">Support technique</option>
                                <option value="enterprise">Solution entreprise</option>
                                <option value="partnership">Partenariat</option>
                                <option value="other">Autre</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </InputGroup>
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                    <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={5}
                        maxLength={500}
                        placeholder="Décrivez votre besoin ou posez votre question..."
                        aria-required="true"
                        aria-invalid={!!errors.message}
                        className={cn(errors.message ? 'border-red-500 focus-visible:ring-red-500' : '')}
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                {/* Submit Button */}
                <div>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        size="lg"
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 group"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Envoi en cours...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Envoyer le message
                            </>
                        )}
                    </Button>
                </div>

                {/* Note */}
                <p className="text-xs text-gray-500 text-center">
                    En envoyant ce formulaire, vous acceptez que nous utilisions vos données pour vous recontacter concernant votre demande.
                </p>
            </form>
        </div>
    )
}
