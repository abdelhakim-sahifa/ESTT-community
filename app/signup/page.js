'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db as staticDb } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        filiere: '',
        startYear: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const validateEmail = (email) => {
        return email.toLowerCase().endsWith('@etu.uae.ac.ma');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateEmail(formData.email)) {
            setMessage('Veuillez utiliser votre adresse académique @etu.uae.ac.ma.');
            return;
        }

        if (formData.password.length < 6) {
            setMessage('Mot de passe requis (6 caractères minimum).');
            return;
        }

        setLoading(true);

        try {
            // Create user in Auth
            const userCred = await signUp(formData.email, formData.password);
            const user = userCred.user;

            // Save user profile in Realtime DB
            const { db } = await import('@/lib/firebase');
            const { ref, set } = await import('firebase/database');

            await set(ref(db, `users/${user.uid}`), {
                email: formData.email.toLowerCase(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                filiere: formData.filiere,
                startYear: formData.startYear,
                createdAt: Date.now()
            });

            setMessage('Inscription réussie — connecté.');
            setTimeout(() => router.push('/'), 1000);
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Erreur lors de l\'inscription.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <section className="contribution-section" style={{ marginTop: '3rem', maxWidth: '700px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>S'inscrire</h2>

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
                        <label htmlFor="email">Adresse email académique *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="prenom.nom@etu.uae.ac.ma"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Minimum 6 caractères"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label htmlFor="firstName">Prénom *</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Nom *</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="filiere">Filière *</label>
                        <select
                            id="filiere"
                            name="filiere"
                            value={formData.filiere}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez votre filière</option>
                            {staticDb.fields.map((field) => (
                                <option key={field.id} value={field.id}>
                                    {field.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="startYear">Année de début d'études *</label>
                        <select
                            id="startYear"
                            name="startYear"
                            value={formData.startYear}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez l'année</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p>
                        Déjà un compte ?{' '}
                        <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                            Se connecter
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
