'use client';

import { useState, useEffect } from 'react';
import { db, ref, get } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClubCard from '@/components/features/clubs/ClubCard';
import { Search, Plus, Loader2, SearchX } from 'lucide-react';
import Link from 'next/link';

export default function ClubsPage() {
    const [clubs, setClubs] = useState([]);
    const [filteredClubs, setFilteredClubs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClubs();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = clubs.filter(club =>
                club.name.toLowerCase().includes(query) ||
                club.description?.toLowerCase().includes(query)
            );
            setFilteredClubs(filtered);
        } else {
            setFilteredClubs(clubs);
        }
    }, [searchQuery, clubs]);

    const fetchClubs = async () => {
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            const clubsRef = ref(db, 'clubs');
            const snapshot = await get(clubsRef);

            if (snapshot.exists()) {
                const clubsData = snapshot.val();
                const clubsArray = Object.entries(clubsData).map(([id, data]) => ({
                    id,
                    ...data
                }));

                // Sort by verified first, then by name
                clubsArray.sort((a, b) => {
                    if (a.verified && !b.verified) return -1;
                    if (!a.verified && b.verified) return 1;
                    return a.name.localeCompare(b.name);
                });

                setClubs(clubsArray);
                setFilteredClubs(clubsArray);
            }
        } catch (error) {
            console.error('Error fetching clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header Section */}
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-b">
                <div className="container py-16 px-4 md:px-6">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
                            Clubs Étudiants
                        </h1>
                        <p className="text-lg text-muted-foreground mb-6">
                            Découvrez les clubs et associations de l'ESTT. Rejoignez une communauté passionnée et participez à des activités enrichissantes.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                            <Input
                                type="text"
                                placeholder="Rechercher un club..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 text-base shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container py-12 px-4 md:px-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {searchQuery ? 'Résultats de recherche' : 'Tous les clubs'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} {searchQuery ? 'trouvé(s)' : 'disponible(s)'}
                        </p>
                    </div>

                    {/* Request to Add Club Button - Subtle placement */}
                    <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href="/clubs/request">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Proposer un club</span>
                        </Link>
                    </Button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredClubs.length === 0 && (
                    <div className="text-center py-20">
                        <div className="mb-4 flex justify-center">
                            <div className="p-4 bg-muted/50 rounded-full">
                                <SearchX className="w-12 h-12 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            {searchQuery ? 'Aucun club trouvé' : 'Aucun club disponible'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {searchQuery
                                ? 'Essayez avec d\'autres mots-clés'
                                : 'Les clubs seront bientôt disponibles'}
                        </p>
                        {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery('')}>
                                Réinitialiser la recherche
                            </Button>
                        )}
                    </div>
                )}

                {/* Clubs Grid */}
                {!loading && filteredClubs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClubs.map((club) => (
                            <ClubCard key={club.id} club={club} />
                        ))}
                    </div>
                )}
            </section>

            {/* Call to Action */}
            {!loading && clubs.length > 0 && (
                <section className="bg-muted/30 border-y py-16">
                    <div className="container px-4 md:px-6 text-center">
                        <h2 className="text-3xl font-bold mb-4">Vous avez un club à proposer ?</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Si votre club n'est pas encore listé, vous pouvez soumettre une demande de création.
                            Les administrateurs examineront votre demande et l'approuveront si elle répond aux critères.
                        </p>
                        <Button size="lg" asChild className="gap-2">
                            <Link href="/clubs/request">
                                <Plus className="w-5 h-5" />
                                Proposer un nouveau club
                            </Link>
                        </Button>
                    </div>
                </section>
            )}
        </main>
    );
}
