'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Smartphone, Apple, ExternalLink, Download, Sparkles, Shield, Zap, Heart } from 'lucide-react';

export default function DownloadPage() {
    const androidDownloadUrl = 'https://expo.dev/artifacts/eas/4QW4Fn5v85oLWxeTcoYeoi.apk';
    const webAppUrl = 'https://esttplus.vercel.app';
    const githubRepo = 'https://github.com/abdelhakim-sahifa/esttplus';
    const githubReleases = '#'; // Placeholder for now

    const screenshots = [
        { src: '/assets/images/screenshots/HomeTap.jpeg', label: 'Accueil' },
        { src: '/assets/images/screenshots/EventsTap.jpeg', label: 'Événements' },
        { src: '/assets/images/screenshots/RessourceTap.jpeg', label: 'Ressources' },
        { src: '/assets/images/screenshots/TicketPage.jpeg', label: 'Billets' },
        { src: '/assets/images/screenshots/profileTap.jpeg', label: 'Profil' },
    ];

    return (
        <main className="min-h-screen">
            {/* Hero Section - Aligned with the rest of the app */}
            <section id="hero" className="relative bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center">
                    {/* App Icon */}
                    <div className="mb-8 relative w-24 h-24 md:w-32 md:h-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Image
                            src="/assets/images/screenshots/appIcon.png"
                            alt="ESTT+ App Icon"
                            fill
                            className="object-contain rounded-[2rem] shadow-2xl shadow-primary/20 border-4 border-white"
                            priority
                        />
                    </div>

                    <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/20 bg-white/60 backdrop-blur text-primary rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        L'application mobile est arrivée
                    </Badge>

                    <h1 className="text-3xl font-heading font-black tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
                        ESTT+ dans votre poche
                    </h1>

                    <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        Toutes vos ressources, actualités et événements académiques accessibles partout, tout le temps. Une expérience fluide conçue pour les étudiants.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        <Button size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1" asChild>
                            <a href={androidDownloadUrl} download>
                                <Download className="mr-2 h-5 w-5" />
                                Télécharger APK
                            </a>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12 bg-white/60 backdrop-blur shadow-sm transition-all duration-300 transform hover:-translate-y-1 text-primary border-primary/20 hover:bg-white" asChild>
                            <a href={webAppUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-5 w-5" />
                                Version Web
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Showcase Section - Using shadcn Badge and Card-like layout */}
            <section className="py-16 bg-white border-y border-slate-100">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col items-center mb-16 text-center">
                        <h2 className="text-3xl font-heading font-bold mb-4 tracking-tight">Une interface moderne et intuitive</h2>
                        <div className="w-20 h-1 bg-primary rounded-full" />
                    </div>

                    <div className="flex overflow-x-auto pb-12 gap-8 no-scrollbar snap-x snap-mandatory px-4">
                        {screenshots.map((screen, index) => (
                            <div
                                key={index}
                                className="flex-none w-[260px] md:w-[300px] snap-center"
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}
                            >
                                <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden shadow-2xl bg-black transform hover:scale-[1.02] transition-transform duration-500">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />
                                    <Image
                                        src={screen.src}
                                        alt={screen.label}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 260px, 300px"
                                    />
                                    <div className="absolute bottom-6 left-0 right-0 text-center">
                                        <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-white font-semibold rounded-full px-4">
                                            {screen.label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Details - Using shadcn Cards strictly */}
            <section className="py-24 px-4 md:px-6 bg-slate-50/50">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Android Card */}
                        <Card className="rounded-[2rem] border-none shadow-xl shadow-blue-500/5 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-primary">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-3xl font-heading font-bold">Android</CardTitle>
                                <CardDescription className="text-base text-muted-foreground mt-2">
                                    Application native haute performance avec toutes les fonctionnalités débloquées.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex-grow flex flex-col">
                                <ul className="space-y-4 mb-10 text-slate-600">
                                    <li className="flex items-start">
                                        <Zap className="w-5 h-5 text-primary mr-3 mt-0.5" />
                                        <span>Notifications en temps réel</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Shield className="w-5 h-5 text-primary mr-3 mt-0.5" />
                                        <span>Accès sécurisé et installation simple</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Download className="w-5 h-5 text-primary mr-3 mt-0.5" />
                                        <span>Dernière mise à jour : v1.0.4</span>
                                    </li>
                                </ul>
                                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10 mt-auto" asChild>
                                    <a href={androidDownloadUrl} download>Installer l'APK</a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* iOS Card */}
                        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-500/5 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 text-slate-900">
                                    <Apple className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-3xl font-heading font-bold">iOS</CardTitle>
                                <CardDescription className="text-base text-muted-foreground mt-2">
                                    L'App Store arrive bientôt. Utilisez la Web App optimisée en attendant.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex-grow flex flex-col">
                                <ul className="space-y-4 mb-10 text-slate-600">
                                    <li className="flex items-start">
                                        <ExternalLink className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                        <span>Installation PWA recommandée</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Smartphone className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                        <span>Fluidité comparable à une app native</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Sparkles className="w-5 h-5 text-primary mr-3 mt-0.5" />
                                        <span className="text-primary font-medium">Bientôt disponible sur l'App Store</span>
                                    </li>
                                </ul>
                                <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold border-2 mt-auto" asChild>
                                    <a href={webAppUrl} target="_blank" rel="noopener noreferrer">Ouvrir la Web App</a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Open Source - Refactored to use shadcn Card and follow brand alignment */}
            <section className="py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-4xl">
                    <Card className="rounded-[2.5rem] border-none bg-primary text-white overflow-hidden relative group">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />

                        <CardContent className="relative p-10 md:p-16 text-center flex flex-col items-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 mb-8 backdrop-blur-sm shadow-xl">
                                <Github className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-heading font-black mb-6 tracking-tight">Open Source & Communautaire</h2>
                            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/80 mb-12">
                                Le projet est entièrement libre sur GitHub. Contribuez, signalez des bugs ou suggérez des fonctionnalités pour améliorer la vie étudiante à l'EST Tétouan.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="w-full sm:w-auto px-10 h-14 text-lg font-bold rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white text-primary hover:bg-white/90"
                                    asChild
                                >
                                    <a href={githubRepo} target="_blank" rel="noopener noreferrer">
                                        <Github className="mr-2 h-6 w-6" />
                                        Code Source
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto px-10 h-14 text-lg font-bold rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white text-primary hover:bg-white/90"
                                    size="lg"
                                    asChild
                                >
                                    <a href={githubReleases} target="_blank" rel="noopener noreferrer">
                                        Historique des releases
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    );
}
