'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ChevronRight,
    Download,
    Github,
    ExternalLink,
    Book,
    Zap,
    Smartphone,
    Shield,
    Search,
    Menu,
    X,
    Layout,
    Calendar,
    Ticket,
    Users,
    ClipboardList,
    QrCode,
    UserCircle,
    Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const sections = [
    {
        title: "Getting Started",
        items: [
            { id: "introduction", title: "Introduction" },
            { id: "installation", title: "Installation" },
        ]
    },
    {
        title: "Core Features",
        items: [
            { id: "hub", title: "Central Hub" },
            { id: "resources", title: "Resource Library" },
            { id: "events", title: "Event Management" },
            { id: "ticketing", title: "Digital Ticketing" },
        ]
    },
    {
        title: "Community",
        items: [
            { id: "clubs", title: "Clubs Ecosystem" },
            { id: "opensource", title: "Open Source" },
        ]
    }
];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('introduction');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-200 selection:bg-zinc-800">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur supports-[backdrop-filter]:bg-[#09090b]/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-bold text-zinc-50 tracking-tight">EsttPlus / Docs</span>
                        </Link>
                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                            <Link href="/downloadAndroid" className="text-zinc-400 hover:text-zinc-50 transition-colors">Android Page</Link>
                            <Link href="https://github.com/abdelhakim-sahifa/esttplus" target="_blank" className="text-zinc-400 hover:text-zinc-50 transition-colors">GitHub</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>
                        <div className="hidden md:flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 border-zinc-800 bg-transparent hover:bg-zinc-900" asChild>
                                <a href="https://github.com/abdelhakim-sahifa/esttplus/releases" target="_blank">
                                    Releases
                                </a>
                            </Button>
                            <Button size="sm" className="h-8 bg-zinc-50 text-zinc-950 hover:bg-zinc-200" asChild>
                                <a href="https://expo.dev/artifacts/eas/4QW4Fn5v85oLWxeTcoYeoi.apk">
                                    Download APK
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container flex-1 items-start md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">

                {/* Sidebar Navigation */}
                <aside className={`fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block overflow-y-auto border-r border-zinc-800 pr-4 ${isMobileMenuOpen ? 'block inset-0 bg-[#09090b] z-50 px-6 pt-10' : ''}`}>
                    <div className="h-full py-6 lg:py-8">
                        <div className="flex flex-col space-y-4">
                            {sections.map((section, i) => (
                                <div key={i} className="pb-4">
                                    <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-bold text-zinc-50 uppercase tracking-widest text-[11px]">
                                        {section.title}
                                    </h4>
                                    <div className="grid grid-flow-row auto-rows-max text-sm gap-1">
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => scrollToSection(item.id)}
                                                className={`group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 transition-colors ${activeSection === item.id ? 'bg-zinc-900 border-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/50'}`}
                                            >
                                                {item.title}
                                                {item.id === 'introduction' && (
                                                    <Badge variant="outline" className="ml-2 h-4 px-1 text-[9px] border-zinc-700 text-zinc-500">v1.0</Badge>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
                    <div className="mx-auto w-full min-w-0">

                        {/* Summary Breadcrumbs */}
                        <div className="mb-4 flex items-center space-x-1 text-sm text-zinc-500">
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">Docs</div>
                            <ChevronRight className="h-4 w-4" />
                            <div className="font-medium text-zinc-300 capitalize">{activeSection}</div>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-24 pb-20">

                            {/* Introduction */}
                            <section id="introduction" className="scroll-m-20">
                                <h1 className="mb-4 text-4xl font-black tracking-tight text-zinc-50 lg:text-5xl">Introduction</h1>
                                <p className="leading-7 text-zinc-400 [&:not(:first-child)]:mt-6 text-lg">
                                    EsttPlus is a comprehensive community engagement platform designed for the <span className="text-zinc-50 font-medium">ESTT (École Supérieure de Technologie de Tétouan)</span> community.
                                    Developed with React Native and Expo, it empowers students, clubs, and administrators to connect, share resources, and manage events seamlessly.
                                </p>
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardContent className="pt-6">
                                            <Smartphone className="mb-2 h-6 w-6 text-zinc-400" />
                                            <h3 className="font-bold text-zinc-50">Cross-Platform</h3>
                                            <p className="text-sm text-zinc-500 mt-1">Native experience optimized for Android devices.</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardContent className="pt-6">
                                            <Shield className="mb-2 h-6 w-6 text-zinc-400" />
                                            <h3 className="font-bold text-zinc-50">Secure API</h3>
                                            <p className="text-sm text-zinc-500 mt-1">Robust backend ensuring data integrity and user privacy.</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            <div className="h-[1px] w-full bg-zinc-800" />

                            {/* Installation */}
                            <section id="installation" className="scroll-m-20">
                                <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 px-1 border-l-4 border-zinc-800">Installation</h2>
                                <p className="leading-7 text-zinc-400 mt-4">
                                    Follow these steps to get EsttPlus running on your Android device:
                                </p>
                                <ol className="mt-6 ml-6 list-decimal space-y-4 text-zinc-400">
                                    <li>Download the latest <span className="text-zinc-50 font-medium">APK file</span> from the official portal.</li>
                                    <li>Enable "Installation from Unknown Sources" in your Android settings.</li>
                                    <li>Locate the downloaded file and tap to install.</li>
                                    <li>Open the app and sign in with your <span className="text-blue-400">@etu.uae.ac.ma</span> email.</li>
                                </ol>
                                <div className="mt-10 p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-zinc-800 p-2 rounded-md">
                                            <Download className="h-5 w-5 text-zinc-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-50 leading-none">Latest Release (v1.0.4)</p>
                                            <p className="text-xs text-zinc-500 mt-1">esttplus-v1.0.4-universal.apk (15.2 MB)</p>
                                        </div>
                                    </div>
                                    <Button size="sm" asChild>
                                        <a href="https://expo.dev/artifacts/eas/4QW4Fn5v85oLWxeTcoYeoi.apk">Download</a>
                                    </Button>
                                </div>
                            </section>

                            <div className="h-[1px] w-full bg-zinc-800" />

                            {/* Features Sections */}
                            <section id="hub" className="scroll-m-20">
                                <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-50">Central Hub</h2>
                                <p className="leading-7 text-zinc-400">
                                    The heartbeat of the application. A dynamic home feed featuring the latest activities, announcements, and updates from university clubs.
                                </p>
                                <div className="mt-6 flex items-start gap-4 p-4 rounded-xl border border-dashed border-zinc-800">
                                    <Layout className="h-6 w-6 text-zinc-500 shrink-0 mt-1" />
                                    <p className="text-sm text-zinc-500 italic">"Stay informed about campus life in real-time. No more missing out on announcements."</p>
                                </div>
                            </section>

                            <section id="resources" className="scroll-m-20">
                                <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-50">Resource Library</h2>
                                <p className="leading-7 text-zinc-400">
                                    A dedicated space for students to share and access educational resources, course materials, and community documents.
                                </p>
                                <ul className="mt-6 space-y-2 text-zinc-400 text-sm">
                                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-zinc-700 rounded-full" /> Course notes and past exams</li>
                                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-zinc-700 rounded-full" /> PDF search and categorization</li>
                                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-zinc-700 rounded-full" /> Peer-to-peer sharing system</li>
                                </ul>
                            </section>

                            <section id="events" className="scroll-m-20">
                                <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-50">Event Management</h2>
                                <p className="leading-7 text-zinc-400">
                                    Discover and participate in campus events. View detailed information, dates, and speaker lineups for workshops, conferences, and club gatherings.
                                </p>
                            </section>

                            <section id="ticketing" className="scroll-m-20">
                                <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-50">Digital Ticketing</h2>
                                <p className="leading-7 text-zinc-400">
                                    Purchase event tickets safely via Stripe integration and access them directly in-app. Secure QR codes are used for attendance tracking.
                                </p>
                            </section>

                            <section id="opensource" className="scroll-m-20">
                                <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-50">Open Source</h2>
                                <p className="leading-7 text-zinc-400 mb-8">
                                    EsttPlus is built by students, for students. The codebase is entirely open source and we welcome contributions to improve the ecosystem.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a href="https://github.com/abdelhakim-sahifa/esttplus" target="_blank" className="flex items-center justify-between p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <Github className="h-8 w-8 text-zinc-50" />
                                            <div>
                                                <p className="font-bold text-zinc-50">Source Code</p>
                                                <p className="text-xs text-zinc-500">Explore on GitHub</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-zinc-700 group-hover:text-zinc-50 transition-colors" />
                                    </a>
                                    <a href="https://github.com/abdelhakim-sahifa/esttplus/releases" target="_blank" className="flex items-center justify-between p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <Monitor className="h-8 w-8 text-zinc-50" />
                                            <div>
                                                <p className="font-bold text-zinc-50">Releases</p>
                                                <p className="text-xs text-zinc-500">Version history</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-zinc-700 group-hover:text-zinc-50 transition-colors" />
                                    </a>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Table of Contents (Desktop Right) */}
                    <div className="hidden text-sm xl:block">
                        <div className="sticky top-16 -mt-10 pt-4">
                            <div className="pb-10 overflow-y-auto max-h-[calc(100vh-5rem)]">
                                <div className="space-y-2">
                                    <p className="font-medium text-zinc-50">On This Page</p>
                                    <ul className="m-0 list-none text-zinc-500 space-y-2 text-xs">
                                        {sections[0].items.map(i => <li key={i.id}><button onClick={() => scrollToSection(i.id)} className="hover:text-zinc-50 transition-colors text-left">{i.title}</button></li>)}
                                        {sections[1].items.map(i => <li key={i.id}><button onClick={() => scrollToSection(i.id)} className="hover:text-zinc-50 transition-colors text-left">{i.title}</button></li>)}
                                        {sections[2].items.map(i => <li key={i.id}><button onClick={() => scrollToSection(i.id)} className="hover:text-zinc-50 transition-colors text-left">{i.title}</button></li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Simple Footer */}
            <footer className="border-t border-zinc-800 py-6 md:px-8 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-zinc-500 md:text-left">
                        Built by the <a href="https://github.com/abdelhakim-sahifa" target="_blank" className="font-medium text-zinc-200 underline underline-offset-4">EsttPlus Community</a>.
                        The source code is available on <a href="https://github.com/abdelhakim-sahifa/esttplus" target="_blank" className="font-medium text-zinc-200 underline underline-offset-4">GitHub</a>.
                    </p>
                    <div className="flex items-center gap-4 text-zinc-500 text-xs font-medium">
                        <Link href="/privacy" className="hover:text-zinc-200">Privacy</Link>
                        <Link href="/terms" className="hover:text-zinc-200">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
