import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full py-6 mt-auto bg-foreground text-background">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm font-medium">
                    &copy; 2025 Promo 2 - EST Tétouan. Fait avec{' '}
                    <i className="fa-solid fa-heart text-destructive" /> pour les futurs étudiants.
                </p>
                <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground/80">
                    <Link href="#" className="hover:text-primary-foreground transition-colors">Politique de confidentialité</Link>
                    <Link href="#" className="hover:text-primary-foreground transition-colors">Conditions d'utilisation</Link>
                </div>
            </div>
        </footer>
    );
}
