'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, ref, get } from '@/lib/firebase';

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsRef = ref(db, 'blog_posts');
                const snapshot = await get(postsRef);
                const data = snapshot.val() || {};

                const postsArray = Object.entries(data).map(([id, post]) => ({
                    id,
                    ...post
                })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setPosts(postsArray);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <main className="container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Blog Étudiant</h1>
                    <p className="hero-sub">
                        Partage tes expériences, conseils et découvertes avec la communauté
                    </p>
                    <div className="hero-ctas">
                        <Link href="/blog/write" className="btn btn-primary">
                            Écrire un article
                        </Link>
                    </div>
                </div>
            </section>

            <section className="blog-posts-section">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Aucun article pour le moment. Soyez le premier à écrire !</p>
                    </div>
                ) : (
                    <div className="grid-container">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.id}`}
                                className="card"
                                style={{ textAlign: 'left' }}
                            >
                                {post.cover_image && (
                                    <img
                                        src={post.cover_image}
                                        alt={post.title}
                                        style={{
                                            width: '100%',
                                            height: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            marginBottom: '1rem'
                                        }}
                                    />
                                )}
                                <h3>{post.title}</h3>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {post.excerpt || post.content?.substring(0, 150) + '...'}
                                </p>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    Par {post.author_name || 'Anonyme'} •{' '}
                                    {new Date(post.created_at).toLocaleDateString('fr-FR')}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
