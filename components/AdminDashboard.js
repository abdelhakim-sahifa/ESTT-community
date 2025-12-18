'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, update, remove, onValue } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // State
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [fields, setFields] = useState({});
    const [semesters, setSemesters] = useState({});
    const [modules, setModules] = useState({});

    // UI State
    const [currentTab, setCurrentTab] = useState('overview'); // overview, pending, all
    const [filters, setFilters] = useState({
        search: '',
        semester: 'all',
        field: 'all',
        type: 'all',
        status: 'all'
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editResource, setEditResource] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        link: '',
        type: 'exam',
        professor: ''
    });

    // Check Admin Status
    // Check Admin Status
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const checkAdmin = async () => {
            try {
                const adminsSnapshot = await get(ref(db, 'Admins'));
                if (!adminsSnapshot.exists()) {
                    console.error('Admins list not found');
                    router.push('/');
                    return;
                }

                const adminsList = adminsSnapshot.val();
                const isUserAdmin = Array.isArray(adminsList)
                    ? adminsList.includes(user.email)
                    : Object.values(adminsList).includes(user.email);

                if (isUserAdmin) {
                    setIsAdmin(true);
                    fetchMetadata();
                    // Listen to resources will be triggered after metadata or in parallel
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [user, authLoading, router]);

    // Fetch Metadata
    const fetchMetadata = async () => {
        try {
            const [fieldsSnap, semestersSnap, modulesSnap] = await Promise.all([
                get(ref(db, 'fields')),
                get(ref(db, 'semesters')),
                get(ref(db, 'modules'))
            ]);

            if (fieldsSnap.exists()) setFields(fieldsSnap.val());
            if (semestersSnap.exists()) setSemesters(semestersSnap.val());
            if (modulesSnap.exists()) setModules(modulesSnap.val());
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    // Listen to Resources
    useEffect(() => {
        if (!isAdmin) return;

        const resourcesRef = ref(db, 'resources');
        const unsubscribe = onValue(resourcesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const loadedResources = [];

                Object.entries(data).forEach(([moduleId, moduleResources]) => {
                    if (typeof moduleResources === 'object') {
                        Object.entries(moduleResources).forEach(([resourceId, resource]) => {
                            loadedResources.push({
                                moduleId,
                                resourceId,
                                ...resource
                            });
                        });
                    }
                });

                setResources(loadedResources);
            } else {
                setResources([]);
            }
        });

        return () => unsubscribe();
    }, [isAdmin]);

    // Filtering Logic
    useEffect(() => {
        let result = [...resources];

        // Tab filtering
        if (currentTab === 'pending') {
            result = result.filter(r => r.unverified === true);
        } else if (currentTab === 'all') {
            // Status filter applies here
            if (filters.status === 'pending') {
                result = result.filter(r => r.unverified === true);
            } else if (filters.status === 'approved') {
                result = result.filter(r => !r.unverified);
            }
        }

        // Common filters
        if (filters.semester !== 'all') {
            result = result.filter(r => r.semester === filters.semester);
        }
        if (filters.field !== 'all') {
            result = result.filter(r => r.field === filters.field);
        }
        if (filters.type !== 'all') {
            result = result.filter(r => r.type === filters.type);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(r =>
                (r.title || '').toLowerCase().includes(search) ||
                (r.professor || '').toLowerCase().includes(search)
            );
        }

        setFilteredResources(result);
    }, [resources, currentTab, filters]);


    // Actions
    const handleApprove = async (moduleId, resourceId) => {
        try {
            await update(ref(db, `resources/${moduleId}/${resourceId}`), {
                unverified: false
            });
            // Toast success
        } catch (error) {
            console.error('Error approving:', error);
        }
    };

    const handleDelete = async (moduleId, resourceId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) return;
        try {
            await remove(ref(db, `resources/${moduleId}/${resourceId}`));
            // Toast success
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleEditClick = (resource) => {
        setEditResource(resource);
        setEditForm({
            title: resource.title || '',
            link: resource.link || '',
            type: resource.type || 'exam',
            professor: resource.professor || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editResource) return;

        try {
            await update(ref(db, `resources/${editResource.moduleId}/${editResource.resourceId}`), {
                title: editForm.title.trim(),
                link: editForm.link.trim(),
                type: editForm.type,
                professor: editForm.professor.trim()
            });
            setIsEditModalOpen(false);
            setEditResource(null);
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    // Helper
    const getTypeIcon = (type) => {
        const icons = { exam: '📝', td: '📋', course: '📚', video: '🎥' };
        return icons[type] || '📄';
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Stats calculation
    const stats = {
        pending: resources.filter(r => r.unverified).length,
        approved: resources.filter(r => !r.unverified).length,
        total: resources.length,
        today: resources.filter(r => {
            if (!r.date) return false;
            return new Date(r.date).toDateString() === new Date().toDateString();
        }).length
    };


    if (authLoading || loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    if (!isAdmin) return null; // Should have redirected

    return (
        <div className="admin-container">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h1><i className="fas fa-shield-alt"></i> Tableau de Bord</h1>
                    <p className="dashboard-subtitle">Gérez les ressources et les contributions de la communauté.</p>
                </div>
                <div className="dashboard-actions">
                    <button className="btn btn-outline" onClick={fetchMetadata}><i className="fas fa-sync-alt"></i> Actualiser</button>
                </div>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${currentTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('overview')}
                >
                    Vue d'ensemble
                </button>
                <button
                    className={`tab-btn ${currentTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('pending')}
                >
                    En attente
                    {stats.pending > 0 && <span className="badge">{stats.pending}</span>}
                </button>
                <button
                    className={`tab-btn ${currentTab === 'all' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('all')}
                >
                    Toutes les ressources
                </button>
            </div>

            {currentTab === 'overview' && (
                <section className="tab-content active">
                    <div className="stats-grid">
                        <div className="stat-card stat-pending">
                            <div className="stat-icon"><i className="fas fa-clock"></i></div>
                            <div className="stat-info">
                                <h3>{stats.pending}</h3>
                                <p>En attente</p>
                            </div>
                        </div>
                        <div className="stat-card stat-approved">
                            <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                            <div className="stat-info">
                                <h3>{stats.approved}</h3>
                                <p>Approuvées</p>
                            </div>
                        </div>
                        <div className="stat-card stat-total">
                            <div className="stat-icon"><i className="fas fa-book"></i></div>
                            <div className="stat-info">
                                <h3>{stats.total}</h3>
                                <p>Total</p>
                            </div>
                        </div>
                        <div className="stat-card stat-today">
                            <div className="stat-icon"><i className="fas fa-star"></i></div>
                            <div className="stat-info">
                                <h3>{stats.today}</h3>
                                <p>Aujourd'hui</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {(currentTab === 'pending' || currentTab === 'all') && (
                <section className="tab-content active">
                    <div className="filters-section">
                        <div className="filters-container">
                            <div className="filter-group search-group">
                                <i className="fas fa-search search-icon"></i>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Rechercher..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                            <div className="filter-group">
                                <select
                                    className="filter-select"
                                    value={filters.semester}
                                    onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                                >
                                    <option value="all">Tous les semestres</option>
                                    {Object.entries(semesters).map(([id, val]) => (
                                        <option key={id} value={id}>{val.name || val}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <select
                                    className="filter-select"
                                    value={filters.field}
                                    onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))}
                                >
                                    <option value="all">Toutes les filières</option>
                                    {Object.entries(fields).map(([id, val]) => (
                                        <option key={id} value={id}>{val.name || val}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <select
                                    className="filter-select"
                                    value={filters.type}
                                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="all">Tous les types</option>
                                    <option value="exam">Examen</option>
                                    <option value="td">TD</option>
                                    <option value="course">Cours</option>
                                    <option value="video">Vidéo</option>
                                </select>
                            </div>
                            {currentTab === 'all' && (
                                <div className="filter-group">
                                    <select
                                        className="filter-select"
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="pending">En attente</option>
                                        <option value="approved">Approuvées</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="resources-container">
                        {filteredResources.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><i className="fas fa-inbox"></i></div>
                                <h3>Aucune ressource trouvée</h3>
                            </div>
                        ) : (
                            filteredResources.map(resource => (
                                <div key={`${resource.moduleId}-${resource.resourceId}`}
                                    className={`resource-card ${resource.unverified ? 'pending' : 'approved'}`}>
                                    <div className="resource-header">
                                        <h4 className="resource-title">{resource.title || 'Sans titre'}</h4>
                                        <span className="resource-type" title={resource.type}>{getTypeIcon(resource.type)}</span>
                                    </div>
                                    <div className="resource-meta">
                                        <div className="meta-row"><i className="fas fa-user-tie"></i> <span>{resource.professor || 'Prof. N/A'}</span></div>
                                        <div className="meta-row"><i className="fas fa-graduation-cap"></i> <span>{fields[resource.field]?.name || fields[resource.field] || resource.field}</span></div>
                                        <div className="meta-row"><i className="fas fa-calendar"></i> <span>{formatDate(resource.date)}</span></div>
                                        {resource.userEmail && <div className="meta-row"><i className="fas fa-user"></i> <span>{resource.userEmail}</span></div>}
                                    </div>
                                    <div className="resource-actions">
                                        <a href={resource.link} target="_blank" className="btn btn-outline" rel="noopener noreferrer"><i className="fas fa-external-link-alt"></i></a>
                                        <button className="btn btn-outline" onClick={() => handleEditClick(resource)}><i className="fas fa-pen"></i></button>
                                        {resource.unverified && (
                                            <button className="btn btn-success" onClick={() => handleApprove(resource.moduleId, resource.resourceId)}><i className="fas fa-check"></i></button>
                                        )}
                                        <button className="btn btn-danger" onClick={() => handleDelete(resource.moduleId, resource.resourceId)}><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {isEditModalOpen && (
                <div className="modal" style={{ display: 'flex' }} onClick={(e) => { if (e.target.className.includes('modal')) setIsEditModalOpen(false); }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Modifier la ressource</h2>
                            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="edit-form">
                            <div className="form-group">
                                <label>Titre</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Lien</label>
                                <input
                                    type="url"
                                    required
                                    value={editForm.link}
                                    onChange={e => setEditForm({ ...editForm, link: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        required
                                        value={editForm.type}
                                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                    >
                                        <option value="exam">Examen</option>
                                        <option value="td">TD</option>
                                        <option value="course">Cours</option>
                                        <option value="video">Vidéo</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Professeur</label>
                                    <input
                                        type="text"
                                        value={editForm.professor}
                                        onChange={e => setEditForm({ ...editForm, professor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
