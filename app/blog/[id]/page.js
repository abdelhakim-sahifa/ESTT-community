'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';

export default function ArticlePage() {
    const params = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const articleRef = ref(db, `blog_posts/${params.id}`);
                const snapshot = await get(articleRef);

                if (snapshot.exists()) {
                    setArticle({ id: params.id, ...snapshot.val() });
                }
            } catch (error) {
                console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchArticle();
        }
    }, [params.id]);

    if (loading) {
        return (
            <main className="container">
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner"></div>
                </div>
            </main>
        );
    }

    if (!article) {
        return (
            <main className="container">
                <section style={{ textAlign: 'center', padding: '4rem' }}>
                    <h1>Article non trouvé</h1>
                    <Link href="/blog" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                        Retour au blog
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="container">
            <article style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem', background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                {article.cover_image && (
                    <img
                        src={article.cover_image}
                        alt={article.title}
                        style={{
                            width: '100%',
                            height: '400px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            marginBottom: '2rem'
                        }}
                    />
                )}

                <h1 style={{ marginBottom: '1rem' }}>{article.title}</h1>

                <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                    Par {article.author_name || 'Anonyme'} •{' '}
                    {new Date(article.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>

                <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {article.content}
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
                    <Link href="/blog" className="btn btn-outline">
                        Retour au blog
                    </Link>
                </div>
            </article>
        </main>
    );
}
