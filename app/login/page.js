'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return email.toLowerCase().endsWith('@etu.uae.ac.ma');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateEmail(email)) {
            setMessage('Veuillez utiliser votre adresse académique @etu.uae.ac.ma.');
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
            setMessage('Connexion réussie.');
            setTimeout(() => router.push('/'), 1000);
        } catch (error) {
            console.error(error);
            setMessage('Identifiants invalides ou erreur de connexion.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <section className="contribution-section" style={{ marginTop: '3rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Se connecter</h2>

                <form onSubmit={handleSubmit} className="contribution-form">
                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            borderRadius: '8px',
                            background: message.includes('réussie') ? '#d4edda' : '#f8d7da',
                            color: message.includes('réussie') ? '#155724' : '#721c24'
                        }}>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Adresse email académique</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="prenom.nom@etu.uae.ac.ma"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p>
                        Pas encore de compte ?{' '}
                        <Link href="/signup" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
