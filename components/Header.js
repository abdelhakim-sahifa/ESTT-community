'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const pathname = usePathname();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const isActive = (path) => pathname === path;

    const navItems = [
        { href: '/', label: 'Accueil' },
        { href: '/contribute', label: 'Contribuer' },
    ];

    if (user) {
        navItems.push({ href: '/chat', label: 'Chat' });
        navItems.push({ href: '/profile', label: 'Profil' });
    }


    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    {pathname !== '/view-ads' && (
                        <Link href="/" className="flex items-center space-x-2">
                            <Image
                                src="/assets/images/logo__five.svg"
                                alt="EST Tétouan Logo"
                                className="h-10 w-auto"
                                width={150}
                                height={50}
                                priority
                            />
                        </Link>
                    )}
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                isActive(item.href) ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
                        {!user ? (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/signup">S'inscrire</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-muted-foreground hidden lg:flex items-center gap-2">
                                    {profile?.firstName ? `Salut, ${profile.firstName}` : user.email}
                                    {profile?.startYear && (new Date().getFullYear() - parseInt(profile.startYear) >= 1) && Object.keys(profile?.contributions || {}).length > 5 && (
                                        <Badge variant="secondary" className="bg-yellow-400 text-white border-none text-[8px] px-1 animate-pulse">
                                            MENTOR
                                        </Badge>
                                    )}
                                </span>

                                <Button variant="outline" onClick={handleSignOut}>
                                    Se déconnecter
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        className="md:hidden"
                        size="icon"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background">
                    <nav className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    isActive(item.href) ? "text-foreground" : "text-muted-foreground"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {!user ? (
                            <div className="flex flex-col gap-2 mt-4">
                                <Button variant="ghost" asChild onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                                <Button asChild onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/signup">S'inscrire</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 mt-4">
                                <span className="text-sm font-medium text-muted-foreground text-center">
                                    {user.email}
                                </span>
                                <Button variant="outline" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                                    Se déconnecter
                                </Button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
