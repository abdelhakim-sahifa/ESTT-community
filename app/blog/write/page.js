'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadResourceFile } from '@/lib/supabase';
import { db, ref, push, set } from '@/lib/firebase';

export default function WriteArticlePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: ''
    });
    const [coverImage, setCoverImage] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        setCoverImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            let coverImageUrl = null;

            // Upload cover image if provided
            if (coverImage) {
                const uploaded = await uploadResourceFile(coverImage);
                coverImageUrl = uploaded.publicUrl;
            }

            // Save to Firebase
            const postData = {
                ...formData,
                cover_image: coverImageUrl,
                created_at: new Date().toISOString(),
                author_name: 'Anonyme', // TODO: Get from auth context
                likes: 0,
                dislikes: 0,
                comments: []
            };

            const postsRef = ref(db, 'blog_posts');
            const newPostRef = push(postsRef);
            await set(newPostRef, postData);

            setMessage('Article publié avec succès !');
            setTimeout(() => router.push('/blog'), 2000);
        } catch (error) {
            console.error('Error publishing article:', error);
            setMessage('Erreur lors de la publication. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Écrire un article</h1>
                    <p className="hero-sub">
                        Partage tes expériences, conseils et découvertes avec la communauté
                    </p>
                </div>
            </section>

            <section className="contribution-section" style={{ maxWidth: '900px' }}>
                <form onSubmit={handleSubmit} className="contribution-form">
                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            borderRadius: '8px',
                            background: message.includes('succès') ? '#d4edda' : '#f8d7da',
                            color: message.includes('succès') ? '#155724' : '#721c24'
                        }}>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="title">Titre de l'article *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="Un titre accrocheur..."
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="excerpt">Extrait (résumé court)</label>
                        <textarea
                            id="excerpt"
                            name="excerpt"
                            rows="2"
                            placeholder="Un court résumé de votre article..."
                            value={formData.excerpt}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">Contenu de l'article *</label>
                        <textarea
                            id="content"
                            name="content"
                            rows="15"
                            placeholder="Écrivez votre article ici..."
                            value={formData.content}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="coverImage">Image de couverture (optionnel)</label>
                        <input
                            type="file"
                            id="coverImage"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <small style={{ color: '#666', fontSize: '0.85rem' }}>
                            Taille maximale: 10 MB
                        </small>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Publication...' : 'Publier l\'article'}
                    </button>
                </form>
            </section>
        </main>
    );
}
