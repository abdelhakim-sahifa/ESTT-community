'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const isActive = (path) => pathname === path;

    return (
        <header className="main-header">
            <div className="container header-content">
                <div className="logo-container">
                    <Link href="/">
                        <Image
                            src="/assets/images/logo__five.svg"
                            alt="EST Tétouan Logo"
                            className="logo"
                            width={150}
                            height={50}
                        />
                    </Link>
                </div>

                <button
                    className="mobile-menu-toggle"
                    id="mobile-menu-toggle"
                    aria-label="Toggle menu"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <i className="fas fa-bars"></i>
                </button>

                <nav className={`main-nav ${mobileMenuOpen ? 'active' : ''}`} id="main-nav">
                    <ul>
                        <li>
                            <Link href="/" className={isActive('/') ? 'active' : ''}>
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link href="/blog" className={isActive('/blog') ? 'active' : ''}>
                                Blog
                            </Link>
                        </li>
                        <li>
                            <Link href="/contribute" className={isActive('/contribute') ? 'active' : ''}>
                                Contribuer
                            </Link>
                        </li>
                        {user && (
                            <li>
                                <Link href="/profile" className={isActive('/profile') ? 'active' : ''}>
                                    Profil
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="auth-controls">
                    {!user ? (
                        <>
                            <Link href="/login" id="btn-open-login" className="btn-link">
                                Se connecter
                            </Link>
                            <Link href="/signup" id="btn-open-signup" className="btn-link">
                                S'inscrire
                            </Link>
                        </>
                    ) : (
                        <>
                            <span id="user-label" className="user-label">
                                {user.email}
                            </span>
                            <button id="btn-signout" className="btn-link" onClick={handleSignOut}>
                                Se déconnecter
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
