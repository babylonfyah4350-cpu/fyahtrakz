import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import Logo from '../components/Logo';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white">
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </Link>
                    <Logo size="small" />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-orange-500" />
                    <h1 className="font-heading text-4xl font-bold text-white">Privacy Policy</h1>
                </div>
                
                <p className="text-zinc-400 mb-8">Last updated: February 2025</p>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            Welcome to FyahTrakz ("we," "our," or "us"). We are committed to protecting your personal 
                            information and your right to privacy. This Privacy Policy explains how we collect, use, 
                            disclose, and safeguard your information when you use our mobile application and website 
                            (collectively, the "Service").
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                        <p className="text-zinc-300 leading-relaxed mb-4">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li><strong>Account Information:</strong> Name, email address, password, and profile picture</li>
                            <li><strong>Artist Information:</strong> Bio, genre, phone number (optional), social media links</li>
                            <li><strong>Payment Information:</strong> Processed securely through Stripe; we do not store card details</li>
                            <li><strong>Usage Data:</strong> Listening history, playlists created, search queries</li>
                            <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                        <p className="text-zinc-300 leading-relaxed mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li>Provide, maintain, and improve our Service</li>
                            <li>Process transactions and send related information</li>
                            <li>Personalize your experience and provide music recommendations</li>
                            <li>Send you technical notices, updates, and support messages</li>
                            <li>Respond to your comments, questions, and customer service requests</li>
                            <li>Monitor and analyze trends, usage, and activities</li>
                            <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Sharing of Information</h2>
                        <p className="text-zinc-300 leading-relaxed mb-4">
                            We may share your information in the following situations:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li><strong>Public Profile:</strong> Artist names, bios, genres, and social links are publicly visible</li>
                            <li><strong>Service Providers:</strong> With third parties that perform services on our behalf (e.g., Stripe for payments)</li>
                            <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In connection with any merger or acquisition</li>
                        </ul>
                        <p className="text-zinc-300 leading-relaxed mt-4">
                            <strong>We do not sell your personal information to third parties.</strong>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We implement appropriate technical and organizational security measures to protect your 
                            personal information. However, no method of transmission over the Internet or electronic 
                            storage is 100% secure. While we strive to use commercially acceptable means to protect 
                            your information, we cannot guarantee its absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
                        <p className="text-zinc-300 leading-relaxed mb-4">
                            Depending on your location, you may have certain rights regarding your personal information:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                            <li><strong>Opt-out:</strong> Opt out of marketing communications at any time</li>
                        </ul>
                        <p className="text-zinc-300 leading-relaxed mt-4">
                            To exercise these rights, please contact us at the email address below.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Services</h2>
                        <p className="text-zinc-300 leading-relaxed mb-4">
                            Our Service uses the following third-party services:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                            <li><strong>Stripe:</strong> For secure payment processing. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Stripe's Privacy Policy</a></li>
                            <li><strong>MongoDB:</strong> For data storage and management</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            Our Service is not intended for children under 13 years of age. We do not knowingly 
                            collect personal information from children under 13. If you are a parent or guardian 
                            and believe your child has provided us with personal information, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes 
                            by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                            You are advised to review this Privacy Policy periodically for any changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
                            <p className="text-white font-medium">FyahTrakz</p>
                            <p className="text-zinc-400">Email: privacy@fyahtrakz.com</p>
                            <p className="text-zinc-400">Website: https://fyahtrakz.com</p>
                        </div>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
                    <p className="text-zinc-500 text-sm">
                        © {new Date().getFullYear()} FyahTrakz. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
