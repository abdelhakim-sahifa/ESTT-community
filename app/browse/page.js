'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db as staticDb } from '@/lib/data';
import { db, ref, get } from '@/lib/firebase';
import './browse.css';

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const [selectedField, setSelectedField] = useState(searchParams.get('field') || '');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedModule) {
            fetchResources();
        }
    }, [selectedModule]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            // Fetch directly from the specific module node
            const resourcesRef = ref(db, `resources/${selectedModule}`);
            const snapshot = await get(resourcesRef);
            const data = snapshot.val() || {};

            // Convert object to array and filter out unverified resources
            const formattedResources = Object.entries(data)
                .map(([id, resource]) => ({
                    id,
                    ...resource
                }))
                .filter(resource => resource.unverified !== true);

            setResources(formattedResources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const modules = selectedField && selectedSemester
        ? staticDb.modules[`${selectedField}-${selectedSemester}`] || []
        : [];

    const selectedFieldData = staticDb.fields.find(f => f.id === selectedField);
    const selectedModuleData = modules.find(m => m.id === selectedModule);

    // Helper to ensure URL has protocol
    const ensureProtocol = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    // Get icon based on resource type
    const getResourceIcon = (type) => {
        switch (type) {
            case 'pdf': return 'fa-file-pdf';
            case 'video': return 'fa-video';
            case 'image': return 'fa-image';
            case 'link': return 'fa-link';
            default: return 'fa-file-alt';
        }
    };

    return (
        <main className="browse-container">
            <section className="browse-hero">
                <div className="hero-content">
                    <h1>Parcourir les ressources</h1>
                    <p>
                        Sélectionnez votre filière, semestre et module pour accéder aux ressources partagées par vos camarades
                    </p>
                </div>
            </section>

            <section className="filters-section">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label htmlFor="field">Filière</label>
                        <select
                            id="field"
                            value={selectedField}
                            onChange={(e) => {
                                setSelectedField(e.target.value);
                                setSelectedSemester('');
                                setSelectedModule('');
                                setResources([]);
                            }}
                            className="filter-select"
                        >
                            <option value="">Sélectionnez une filière</option>
                            {staticDb.fields.map((field) => (
                                <option key={field.id} value={field.id}>
                                    {field.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="semester">Semestre</label>
                        <select
                            id="semester"
                            value={selectedSemester}
                            onChange={(e) => {
                                setSelectedSemester(e.target.value);
                                setSelectedModule('');
                                setResources([]);
                            }}
                            disabled={!selectedField}
                            className="filter-select"
                        >
                            <option value="">Sélectionnez un semestre</option>
                            {staticDb.semesters.map((sem) => (
                                <option key={sem} value={sem}>
                                    {sem}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="module">Module</label>
                        <select
                            id="module"
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            disabled={!selectedSemester}
                            className="filter-select"
                        >
                            <option value="">Sélectionnez un module</option>
                            {modules.map((mod) => (
                                <option key={mod.id} value={mod.id}>
                                    {mod.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {selectedModule && (
                <section className="resources-section">
                    <h2 className="section-title">
                        Ressources pour {selectedModuleData?.name}
                    </h2>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spi"></div>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-folder-open"></i>
                            <p>Aucune ressource disponible pour ce module.</p>
                            <Link href="/contribute" className="btn-primary">
                                Contribuer une ressource
                            </Link>
                        </div>
                    ) : (
                        <div className="resources-grid">
                            {resources.map((resource) => {
                                // Check for url, link, or file fields (legacy support)
                                const rawUrl = resource.url || resource.link || resource.file;
                                const validUrl = rawUrl ? ensureProtocol(rawUrl) : null;

                                // Render logic for clickable card vs disabled
                                const cardContent = (
                                    <>
                                        <div className="resource-icon">
                                            <i className={`fas ${getResourceIcon(resource.type)}`}></i>
                                        </div>
                                        <h3 className="resource-title">{resource.title}</h3>
                                        {resource.description && (
                                            <p className="resource-description">{resource.description}</p>
                                        )}
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className="resource-type">
                                                {resource.type}
                                            </span>
                                            {resource.professor && (
                                                <span style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i className="fas fa-chalkboard-teacher"></i> {resource.professor}
                                                </span>
                                            )}
                                            <span className="resource-action" style={{ color: validUrl ? 'var(--primary-color, #007bff)' : '#ccc' }}>
                                                {validUrl ? (
                                                    <>Accéder <i className="fas fa-arrow-right"></i></>
                                                ) : (
                                                    <>Non disponible <i className="fas fa-ban"></i></>
                                                )}
                                            </span>
                                        </div>
                                    </>
                                );

                                return validUrl ? (
                                    <a
                                        key={resource.id}
                                        href={validUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resource-card"
                                    >
                                        {cardContent}
                                    </a>
                                ) : (
                                    <div
                                        key={resource.id}
                                        className="resource-card"
                                        style={{ cursor: 'not-allowed', opacity: 0.7 }}
                                    >
                                        {cardContent}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}

