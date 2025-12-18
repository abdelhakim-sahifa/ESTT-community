'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db as staticDb } from '@/lib/data';
import { uploadResourceFile } from '@/lib/supabase';
import { db, ref, push, set, get } from '@/lib/firebase';
import './contribute.css';

export default function ContributePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        field: '',
        semester: '',
        module: '',
        professor: '',
        title: '',
        description: '',
        type: 'pdf',
        url: '',
        anonymous: false
    });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [professors, setProfessors] = useState([]);

    useEffect(() => {
        // Fetch professors list
        const fetchProfessors = async () => {
            try {
                const snapshot = await get(ref(db, 'professors'));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // Handle both array and object structures
                    const profList = Array.isArray(data)
                        ? data
                        : (data.professors || Object.values(data));
                    setProfessors(profList);
                }
            } catch (error) {
                console.error("Error fetching professors:", error);
            }
        };

        fetchProfessors();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoading(true);

        try {
            let resourceUrl = formData.url;

            // Upload file if provided
            if (file) {
                // Check for file size (client side)
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error("Le fichier dépasse la taille maximale de 10 Mo.");
                }
                const uploaded = await uploadResourceFile(file);
                if (!uploaded && !uploaded.publicUrl) {
                    throw new Error("Erreur lors de l'upload du fichier.");
                }
                resourceUrl = uploaded.publicUrl;
            }

            // Save to Firebase
            // Save to Firebase under resources/moduleId
            const contributionData = {
                ...formData,
                url: resourceUrl,
                fileName: file?.name || null,
                created_at: new Date().toISOString(),
                verified: true // Auto-verify for now
            };

            const resourcesRef = ref(db, `resources/${formData.module}`);
            const newResourceRef = push(resourcesRef);
            await set(newResourceRef, contributionData);

            setMessage('Contribution envoyée avec succès ! Elle sera vérifiée sous peu.');
            setTimeout(() => router.push('/thanks'), 2000);
        } catch (error) {
            console.error('Error submitting contribution:', error);
            setIsError(true);
            setMessage(error.message || 'Erreur lors de l\'envoi. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const modules = formData.field && formData.semester
        ? staticDb.modules[`${formData.field}-${formData.semester}`] || []
        : [];

    return (
        <main className="contribute-container">
            <section className="contribute-hero">
                <div className="hero-content">
                    <h1>Contribuer une ressource</h1>
                    <p>
                        Aide tes camarades en partageant tes cours, TDs, exercices ou vidéos
                    </p>
                </div>
            </section>

            <section className="contribution-section">
                <form onSubmit={handleSubmit} className="contribution-form">
                    {message && (
                        <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`}>
                            <i className={`fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="field">Filière *</label>
                        <select
                            id="field"
                            name="field"
                            value={formData.field}
                            onChange={handleChange}
                            required
                            className="form-control"
                        >
                            <option value="">Sélectionnez une filière</option>
                            {staticDb.fields.map((field) => (
                                <option key={field.id} value={field.id}>
                                    {field.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="semester">Semestre *</label>
                        <select
                            id="semester"
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            required
                            className="form-control"
                        >
                            <option value="">Sélectionnez un semestre</option>
                            {staticDb.semesters.map((sem) => (
                                <option key={sem} value={sem}>
                                    {sem}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="module">Module *</label>
                        <select
                            id="module"
                            name="module"
                            value={formData.module}
                            onChange={handleChange}
                            required
                            disabled={!formData.field || !formData.semester}
                            className="form-control"
                        >
                            <option value="">Sélectionnez un module</option>
                            {modules.map((mod) => (
                                <option key={mod.id} value={mod.id}>
                                    {mod.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="professor">Professeur (Optionnel)</label>
                        <select
                            id="professor"
                            name="professor"
                            value={formData.professor}
                            onChange={handleChange}
                            className="form-control"
                        >
                            <option value="">Sélectionnez un professeur</option>
                            {professors.map((p, index) => {
                                const name = typeof p === 'string' ? p : p.name;
                                return (
                                    <option key={index} value={name}>
                                        {name} {p.department ? `— ${p.department}` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="title">Titre de la ressource *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="Ex: Cours complet chapitre 3"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            placeholder="Décrivez brièvement la ressource..."
                            value={formData.description}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="type">Type de ressource *</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="form-control"
                        >
                            <option value="pdf">PDF</option>
                            <option value="image">Image</option>
                            <option value="video">Vidéo (lien)</option>
                            <option value="link">Lien externe</option>
                        </select>
                    </div>

                    {(formData.type === 'video' || formData.type === 'link') ? (
                        <div className="form-group">
                            <label htmlFor="url">URL *</label>
                            <input
                                type="url"
                                id="url"
                                name="url"
                                placeholder="https://..."
                                value={formData.url}
                                onChange={handleChange}
                                required
                                className="form-control"
                            />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label htmlFor="file">Fichier *</label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="file"
                                    accept={formData.type === 'pdf' ? '.pdf' : 'image/*'}
                                    onChange={handleFileChange}
                                    required
                                />
                                <div style={{ fontSize: '2rem', color: '#ccc', marginBottom: '0.5rem' }}>
                                    <i className="fas fa-cloud-upload-alt"></i>
                                </div>
                                <span>
                                    {file ? file.name : "Cliquez ou glissez-déposez un fichier ici"}
                                </span>
                                {formData.type === 'pdf' && <div className="file-helper">PDF uniquement</div>}
                                {formData.type === 'image' && <div className="file-helper">Images uniquement</div>}
                            </div>
                            <small className="file-helper">
                                Taille maximale: 10 MB
                            </small>
                        </div>
                    )}

                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="anonymous"
                            name="anonymous"
                            checked={formData.anonymous}
                            onChange={handleChange}
                        />
                        <label htmlFor="anonymous" style={{ fontWeight: 'normal' }}>
                            Contribuer de manière anonyme
                        </label>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading && <i className="fas fa-spinner fa-spin"></i>}
                        {loading ? 'Envoi en cours...' : 'Soumettre la ressource'}
                    </button>
                </form>
            </section>
        </main>
    );
}

