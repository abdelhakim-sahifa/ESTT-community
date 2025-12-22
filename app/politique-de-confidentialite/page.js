export default function PrivacyPolicy() {
    return (
        <main className="container py-20 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8">Politique de confidentialité</h1>
            <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
                <p>Dernière mise à jour : 22 décembre 2025</p>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Collecte des données</h2>
                    <p>Nous collectons les informations que vous nous fournissez lors de la création de votre compte, notamment votre nom, prénom, adresse email académique, filière et année d'étude.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Utilisation des données</h2>
                    <p>Vos données sont utilisées pour :</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Gérer votre compte et vous identifier sur la plateforme.</li>
                        <li>Attribuer vos contributions (ressources, articles) à votre profil.</li>
                        <li>Vous permettre de communiquer avec d'autres étudiants via le chat.</li>
                        <li>Améliorer nos services et l'expérience utilisateur.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Protection des données</h2>
                    <p>Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès, modification, divulgation ou destruction non autorisé.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Partage des données</h2>
                    <p>Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles identifiables à des tiers. Cela n'inclut pas les tierces parties de confiance qui nous aident à exploiter notre site Web (comme Firebase), tant que ces parties conviennent de garder ces informations confidentielles.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Vos droits</h2>
                    <p>Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ces droits en nous contactant ou via les paramètres de votre profil.</p>
                </section>
            </div>
        </main>
    );
}
