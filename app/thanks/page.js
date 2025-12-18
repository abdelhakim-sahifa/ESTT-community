import Link from 'next/link';

export default function ThanksPage() {
    return (
        <main className="container">
            <section style={{ maxWidth: '720px', margin: '3rem auto 4rem', background: 'linear-gradient(180deg, #fff, #fbfdff)', borderRadius: '18px', padding: '2rem', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                    Merci pour ta contribution !
                </h2>
                <p style={{ color: '#33475b', marginBottom: '1rem' }}>
                    Ta ressource a été soumise avec succès. Elle sera vérifiée par notre équipe et publiée sous peu.
                </p>
                <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '2rem' }}>
                    Grâce à toi, la communauté EST Tétouan devient plus forte et solidaire.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/contribute" className="btn btn-primary">
                        Contribuer une autre ressource
                    </Link>
                    <Link href="/" className="btn btn-outline">
                        Retour à l'accueil
                    </Link>
                </div>
            </section>
        </main>
    );
}
