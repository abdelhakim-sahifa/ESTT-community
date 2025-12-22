'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, GraduationCap, Calendar, Settings, LogOut, Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, profile, loading, signOut } = useAuth();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <main className="container py-20 flex flex-col items-center justify-center text-center">
                <Card className="max-w-md w-full p-8 shadow-sm">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <CardTitle className="mb-2">Accès restreint</CardTitle>
                    <CardDescription className="mb-6 text-base">
                        Veuillez vous connecter pour accéder à votre profil et gérer vos contributions.
                    </CardDescription>
                    <Button className="w-full h-11" asChild>
                        <a href="/login">Se connecter</a>
                    </Button>
                </Card>
            </main>
        );
    }

    return (
        <main className="container py-12 max-w-4xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight">Mon Profil</h1>
                    <p className="text-muted-foreground text-lg">
                        Gérez vos informations personnelles et vos activités sur la plateforme.
                    </p>
                </div>
                <Button variant="destructive" className="gap-2 h-11" onClick={signOut}>
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 shadow-sm border-muted-foreground/10 h-fit">
                    <CardHeader className="text-center pb-8 border-b">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-12 h-12 text-primary" />
                        </div>
                        <CardTitle className="text-xl capitalize">
                            {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Étudiant'}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-2 uppercase tracking-wider font-bold">
                            {profile?.filiere || 'Utilisateur'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Inscrit en {profile?.startYear || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-8">
                    <Card className="shadow-sm border-muted-foreground/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle>Détails du compte</CardTitle>
                                <CardDescription>Modifiez vos informations visibles par la communauté.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input id="firstName" defaultValue={profile?.firstName} readOnly className="bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <Input id="lastName" defaultValue={profile?.lastName} readOnly className="bg-muted/30" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Adresse email académique</Label>
                                <Input id="email" defaultValue={user.email} readOnly className="bg-muted/30" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="filiere">Filière</Label>
                                    <Input id="filiere" defaultValue={profile?.filiere} readOnly className="bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year">Année d'entrée</Label>
                                    <Input id="year" defaultValue={profile?.startYear} readOnly className="bg-muted/30" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t py-4">
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <Settings className="w-3 h-3" />
                                Pour modifier vos informations, veuillez contacter l'administration.
                            </p>
                        </CardFooter>
                    </Card>

                    <Card className="shadow-sm border-muted-foreground/10">
                        <CardHeader>
                            <CardTitle>Vos Contributions</CardTitle>
                            <CardDescription>Consultez l'historique de vos ressources partagées.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed mx-6 mb-6 rounded-xl bg-muted/20">
                            <GraduationCap className="w-10 h-10 text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">Aucune contribution</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                                Partagez vos ressources pour aider la communauté !
                            </p>
                            <Button variant="outline" className="mt-6" asChild>
                                <a href="/contribute">Contribuer maintenant</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
