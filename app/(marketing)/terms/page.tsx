import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Terms of Service - Jokko',
    description: 'Terms of service and conditions for using Jokko WhatsApp Business Platform',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back link */}
                <Link
                    href="/auth/sign-in"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                </Link>

                <div className="bg-white shadow-sm rounded-lg px-8 py-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

                    <p className="text-sm text-gray-600 mb-8">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    <div className="space-y-8 text-gray-700">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                            <p className="mb-4">
                                By accessing and using the Jokko WhatsApp Business Platform (&quot;Service&quot;), you agree to be bound by these Terms of Service
                                (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                            <p className="mb-4">
                                Jokko provides a multi-tenant WhatsApp Business messaging platform that enables businesses to manage customer
                                conversations, automate responses, and analyze communication metrics. The Service includes:
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Multi-channel messaging capabilities</li>
                                <li>Team collaboration features</li>
                                <li>Automated response workflows</li>
                                <li>Analytics and reporting tools</li>
                                <li>Integration with WhatsApp Business API</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
                            <p className="mb-4">
                                To use our Service, you must create an account. You are responsible for:
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Providing accurate and complete information</li>
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use Policy</h2>
                            <p className="mb-4">You agree not to use our Service to:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Violate any laws or regulations</li>
                                <li>Send spam or unsolicited messages</li>
                                <li>Harass, abuse, or harm others</li>
                                <li>Impersonate any person or entity</li>
                                <li>Transmit viruses or malicious code</li>
                                <li>Interfere with the operation of the Service</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. WhatsApp Compliance</h2>
                            <p className="mb-4">
                                Users must comply with WhatsApp Business Terms of Service and WhatsApp Business Policy. This includes:
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Obtaining necessary consent from message recipients</li>
                                <li>Following WhatsApp&apos;s commerce and business messaging policies</li>
                                <li>Respecting opt-out requests</li>
                                <li>Using approved message templates</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Protection</h2>
                            <p className="mb-4">
                                We take data protection seriously. By using our Service, you acknowledge that:
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>We process data in accordance with our Privacy Policy</li>
                                <li>You are responsible for the data you collect through the Service</li>
                                <li>You must comply with applicable data protection laws</li>
                                <li>We implement industry-standard security measures</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Fees and Payment</h2>
                            <p className="mb-4">
                                Our Service includes a 14-day free trial. After the trial period:
                            </p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Subscription fees will apply as per your selected plan</li>
                                <li>Payments are due in advance on a monthly or annual basis</li>
                                <li>All fees are non-refundable except as required by law</li>
                                <li>We reserve the right to change our fees with 30 days notice</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
                            <p className="mb-4">
                                The Service and its original content, features, and functionality are owned by Jokko and are protected by
                                international copyright, trademark, and other intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
                            <p className="mb-4">
                                To the fullest extent permitted by law, Jokko shall not be liable for any indirect, incidental, special,
                                consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill,
                                or other intangible losses.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
                            <p className="mb-4">
                                We reserve the right to terminate or suspend your account immediately, without prior notice or liability,
                                for any reason, including breach of these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
                            <p className="mb-4">
                                We reserve the right to modify these Terms at any time. We will notify users of any material changes
                                via email or through the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Information</h2>
                            <p className="mb-4">
                                If you have any questions about these Terms, please contact us at:
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="font-medium">Jokko Support</p>
                                <p>Email: legal@jokko.io</p>
                                <p>Website: www.jokko.io</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
