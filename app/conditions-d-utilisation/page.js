export default function TermsOfUse() {
    return (
        <main className="container py-20 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8">Conditions d'utilisation</h1>
            <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
                <p>Dernière mise à jour : 22 décembre 2025</p>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptation des conditions</h2>
                    <p>En accédant à ce site, vous acceptez d'être lié par les présentes conditions d'utilisation, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable du respect des lois locales applicables.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Licence d'utilisation</h2>
                    <p>La plateforme ESTT Community est destinée à un usage éducatif et collaboratif entre les étudiants de l'EST Tétouan. Vous vous engagez à ne pas utiliser la plateforme pour :</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Publier du contenu illégal, offensant ou inapproprié.</li>
                        <li>Porter atteinte aux droits de propriété intellectuelle d'autrui.</li>
                        <li>Tenter de perturber le bon fonctionnement du site.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Responsabilité du contenu</h2>
                    <p>Les utilisateurs sont seuls responsables du contenu qu'ils publient sur la plateforme. ESTT Community ne garantit pas l'exactitude ou la fiabilité des ressources partagées par les étudiants.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Modération</h2>
                    <p>Nous nous réservons le droit de supprimer tout contenu jugé inapproprié ou ne respectant pas les présentes conditions, sans préavis.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Modifications</h2>
                    <p>ESTT Community peut réviser ces conditions d'utilisation pour son site Web à tout moment sans préavis. En utilisant ce site Web, vous acceptez d'être lié par la version alors en vigueur de ces conditions d'utilisation.</p>
                </section>
            </div>
        </main>
    );
}
