export default function ProfilePage() {
    return (
        <main className="container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Mon Profil</h1>
                    <p className="hero-sub">
                        Gérez vos informations et vos contributions
                    </p>
                </div>
            </section>

            <section style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem', background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Informations personnelles</h2>
                <p style={{ color: '#666' }}>
                    Cette page sera disponible après connexion. Vous pourrez y consulter et modifier vos informations personnelles, voir vos contributions et gérer votre compte.
                </p>
            </section>
        </main>
    );
}
