'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, ref, get } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, Calendar, User, Building2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function TicketPage() {
    const params = useParams();
    const ticketId = params.ticketId;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            const ticketRef = ref(db, `tickets/${ticketId}`);
            const ticketSnap = await get(ticketRef);

            if (!ticketSnap.exists()) {
                setError('Ticket introuvable');
                setLoading(false);
                return;
            }

            setTicket({ id: ticketId, ...ticketSnap.val() });
        } catch (error) {
            console.error(error);
            setError('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-xl text-muted-foreground">{error || 'Ticket invalide'}</p>
                <Button asChild>
                    <Link href="/">Retour à l'accueil</Link>
                </Button>
            </div>
        );
    }

    // QR Code Data
    const qrData = JSON.stringify({
        id: ticket.id,
        event: ticket.eventName,
        club: ticket.clubId,
        user: ticket.userId,
        status: ticket.status
    });

    // Using a public QR code API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    return (
        <main className="min-h-screen bg-slate-900 py-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Button variant="ghost" asChild className="text-white hover:text-white hover:bg-white/10 mb-4">
                        <Link href={`/clubs/${ticket.clubId}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour au club
                        </Link>
                    </Button>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Header Decoration */}
                    <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-600 relative p-6 text-white">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Ticket className="w-32 h-32" />
                        </div>
                        <h1 className="text-2xl font-bold relative z-10">{ticket.eventName}</h1>
                        <div className="flex items-center gap-2 mt-2 opacity-90 relative z-10">
                            <Building2 className="w-4 h-4" />
                            <span>{ticket.clubName}</span>
                        </div>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-6 space-y-6 relative">
                        {/* Cutout circles */}
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-900 translate-y-[-50%]"></div>
                        <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-slate-900 translate-y-[-50%]"></div>

                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-sm relative group">
                                <Image
                                    src={qrUrl}
                                    alt="Ticket QR Code"
                                    width={200}
                                    height={200}
                                    className={ticket.status === 'pending' ? 'blur-md opacity-50 transition-all' : ''}
                                />
                                {ticket.status === 'pending' && (
                                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                                        <p className="text-[10px] font-bold text-slate-800 bg-white/80 backdrop-blur-sm p-2 rounded border shadow-sm">
                                            QR Code activé après validation
                                        </p>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 font-mono">{ticket.id.substring(0, 8).toUpperCase()}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Participant</p>
                                    <p className="font-medium text-slate-900">{ticket.userName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Date d'émission</p>
                                    <p className="font-medium text-slate-900">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border",
                                ticket.status === 'valid'
                                    ? "bg-green-50 border-green-100"
                                    : "bg-orange-50 border-orange-100"
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    ticket.status === 'valid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                                )}>
                                    {ticket.status === 'valid' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={cn("text-xs", ticket.status === 'valid' ? "text-green-600" : "text-orange-600")}>Statut du ticket</p>
                                    <p className={cn("font-bold uppercase tracking-wide text-sm", ticket.status === 'valid' ? "text-green-700" : "text-orange-700")}>
                                        {ticket.status === 'valid' ? 'Validé' : 'En attente de validation'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 p-6 border-t border-dashed border-slate-200">
                        <p className="text-center text-xs text-muted-foreground">
                            Veuillez présenter ce code QR à l'entrée de l'événement.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
