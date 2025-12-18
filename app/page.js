'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db as staticDb } from '@/lib/data';
import { db as firebaseDb, ref, get } from '@/lib/firebase';

export default function Home() {
    const [stats, setStats] = useState({
        resources: 0,
        contributions: 0,
        modules: 0
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch stats from Firebase
        const fetchStats = async () => {
            try {
                const resourcesRef = ref(firebaseDb, 'resources');
                const contributionsRef = ref(firebaseDb, 'contributions');

                const [resourcesSnap, contributionsSnap] = await Promise.all([
                    get(resourcesRef),
                    get(contributionsRef)
                ]);

                const resourcesData = resourcesSnap.val() || {};
                const contributionsData = contributionsSnap.val() || {};

                const totalModules = Object.keys(staticDb.modules).reduce((sum, key) => {
                    return sum + staticDb.modules[key].length;
                }, 0);

                setStats({
                    resources: Object.keys(resourcesData).length,
                    contributions: Object.keys(contributionsData).length,
                    modules: totalModules
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: Implement search functionality
        console.log('Search:', searchQuery);
    };

    return (
        <main className="container">
            <section id="hero" className="hero-section">
                <div className="hero-content">
                    <h1>Partage tes ressources — aide tes camarades, gagne du temps</h1>
                    <p className="hero-sub">
                        Tu as un cours, un TD, un exercice ou une vidéo utile ? Contribue en moins de 2 minutes.
                    </p>

                    <div className="hero-ctas">
                        <Link href="/contribute" className="btn btn-primary">
                            Contribuer une ressource
                        </Link>
                        <Link href="/browse" className="btn btn-outline">
                            Parcourir les ressources
                        </Link>
                    </div>

                    <div className="hero-meta" aria-hidden="false">
                        <div className="meta-item">
                            <strong id="hero-stat-resources">{stats.resources}</strong> ressources
                        </div>
                        <div className="meta-item">
                            <strong id="hero-stat-contributions">{stats.contributions}</strong> contributions en attente
                        </div>
                        <div className="meta-item">
                            <strong id="hero-stat-modules">{stats.modules}</strong> modules
                        </div>
                    </div>

                    <div className="how-works">
                        Formats acceptés : PDF · Images · Liens · Vidéos — Anonyme possible · Modération rapide
                    </div>

                    <form className="search-bar" onSubmit={handleSearch}>
                        <i className="fa-solid fa-search"></i>
                        <input
                            type="text"
                            id="global-search"
                            placeholder="Rechercher un module, un cours..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
            </section>

            {/* Banners for main programs */}
            <section id="program-banners" className="banners-section">
                <div className="grid-container banners-grid" id="banners-container">
                    <Link className="banner-card" href="/browse?field=ia" aria-label="IA program">
                        <Image
                            src="/assets/images/DUT-1.jpg"
                            alt="AI program banner"
                            width={300}
                            height={160}
                            loading="lazy"
                        />
                        <div className="banner-label">Intelligence Artificielle</div>
                    </Link>
                    <Link className="banner-card" href="/browse?field=insem" aria-label="Naval program">
                        <Image
                            src="/assets/images/DUT-2.jpg"
                            alt="Naval program banner"
                            width={300}
                            height={160}
                            loading="lazy"
                        />
                        <div className="banner-label">Industrie Navale</div>
                    </Link>
                    <Link className="banner-card" href="/browse?field=casi" aria-label="Cyber program">
                        <Image
                            src="/assets/images/DUT-3.jpg"
                            alt="Cyber program banner"
                            width={300}
                            height={160}
                            loading="lazy"
                        />
                        <div className="banner-label">Cybersécurité</div>
                    </Link>
                    <Link className="banner-card" href="/browse?field=idd" aria-label="IDD program">
                        <Image
                            src="/assets/images/program-big3.jpg"
                            alt="IDD program banner"
                            width={300}
                            height={160}
                            loading="lazy"
                        />
                        <div className="banner-label">Informatique & Dév Digital</div>
                    </Link>
                </div>
            </section>

            {/* Statistics */}
            <section id="site-stats" className="stats-section">
                <h2 className="section-header">État de la plateforme</h2>
                <div className="stats-grid" id="stats-container">
                    <div className="stat-card">
                        <div className="stat-value" id="stat-contributions">{stats.contributions}</div>
                        <div className="stat-label">Contributions en attente</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" id="stat-resources">{stats.resources}</div>
                        <div className="stat-label">Ressources totales</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" id="stat-modules">{stats.modules}</div>
                        <div className="stat-label">Modules disponibles</div>
                    </div>
                </div>
            </section>

            {/* Fields Grid */}
            <section id="fields-grid" className="fields-section">
                <h2>Nos Filières</h2>
                <div className="grid-container" id="fields-container">
                    {staticDb.fields.map((field) => (
                        <Link
                            key={field.id}
                            href={`/browse?field=${field.id}`}
                            className="card"
                        >
                            <div className="card-icon">
                                <i className={`fas ${field.icon}`}></i>
                            </div>
                            <h3>{field.name}</h3>
                            <p>{field.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
