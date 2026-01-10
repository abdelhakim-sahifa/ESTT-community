'use client';

import { useState, useEffect } from 'react';
import { db, ref, onValue, update } from '@/lib/firebase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Search,
    CheckCircle2,
    XCircle,
    ExternalLink,
    MessageSquare,
    Clock,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { AD_STATUSES } from '@/lib/ad-constants';
import { adNotifications } from '@/lib/ad-notifications';

export default function AdminAds() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Modal states
    const [selectedAd, setSelectedAd] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showPaidModal, setShowPaidModal] = useState(false);

    useEffect(() => {
        const adsRef = ref(db, 'studentAds');
        const unsubscribe = onValue(adsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.entries(data).map(([id, ad]) => ({ id, ...ad }))
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAds(list);
            } else {
                setAds([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredAds = ads.filter(ad => {
        const matchesSearch = ad.title.toLowerCase().includes(search.toLowerCase()) ||
            ad.publisherEmail.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || ad.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleApprove = async () => {
        if (!selectedAd) return;
        try {
            await update(ref(db, `studentAds/${selectedAd.id}`), {
                status: AD_STATUSES.PAYMENT_REQUIRED
            });
            adNotifications.sendApprovalNotice(selectedAd.publisherEmail, selectedAd.title, {
                duration: selectedAd.duration,
                price: selectedAd.price
            });
            setShowApproveModal(false);
            setSelectedAd(null);
        } catch (error) {
            alert("Erreur lors de l'approbation");
        }
    };

    const handleReject = async () => {
        if (!selectedAd || !rejectReason) return;
        try {
            await update(ref(db, `studentAds/${selectedAd.id}`), {
                status: AD_STATUSES.REFUSED,
                adminNote: rejectReason
            });
            adNotifications.sendRejectionNotice(selectedAd.publisherEmail, selectedAd.title, rejectReason);
            setShowRejectModal(false);
            setSelectedAd(null);
            setRejectReason('');
        } catch (error) {
            alert("Erreur lors du refus");
        }
    };

    const handleMarkAsPaid = async () => {
        if (!selectedAd) return;
        try {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + selectedAd.duration);

            const invoiceId = `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            await update(ref(db, `studentAds/${selectedAd.id}`), {
                status: AD_STATUSES.LIVE,
                paymentStatus: 'paid',
                paymentDate: new Date().toISOString(),
                expirationDate: expirationDate.toISOString(),
                invoiceId: invoiceId
            });

            adNotifications.sendInvoice(selectedAd.publisherEmail, selectedAd.title, selectedAd.price, invoiceId);

            setShowPaidModal(false);
            setSelectedAd(null);
        } catch (error) {
            alert("Erreur lors du marquage comme payé");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Modération des Annonces</h2>
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-10 w-64 h-10 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 px-4 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                        onValue={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value={AD_STATUSES.UNDER_REVIEW}>En Révision</option>
                        <option value={AD_STATUSES.PAYMENT_REQUIRED}>Attente Paiement</option>
                        <option value={AD_STATUSES.LIVE}>En Ligne</option>
                        <option value={AD_STATUSES.REFUSED}>Refusés</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredAds.map((ad) => (
                    <Card key={ad.id} className="rounded-2xl border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="w-full lg:w-48 h-32 relative rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                    {ad.type === 'video' ? (
                                        <video src={ad.url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={ad.url} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 truncate">{ad.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">{ad.publisherEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {ad.status === AD_STATUSES.UNDER_REVIEW && (
                                                <Badge className="bg-blue-50 text-blue-600 border-blue-100">À Réviser</Badge>
                                            )}
                                            {ad.status === AD_STATUSES.PAYMENT_REQUIRED && (
                                                <Badge className="bg-orange-50 text-orange-600 border-orange-100">Attente Paiement</Badge>
                                            )}
                                            {ad.status === AD_STATUSES.LIVE && (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Actif</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-600 line-clamp-2 mt-2">{ad.description}</p>

                                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            {ad.price} MAD · {ad.duration} jours
                                        </div>

                                        <div className="ml-auto flex items-center gap-2">
                                            {ad.status === AD_STATUSES.UNDER_REVIEW && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold"
                                                        onClick={() => { setSelectedAd(ad); setShowApproveModal(true); }}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approuver
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 px-4 rounded-lg text-red-600 hover:bg-red-50 font-bold"
                                                        onClick={() => { setSelectedAd(ad); setShowRejectModal(true); }}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" /> Refuser
                                                    </Button>
                                                </>
                                            )}
                                            {ad.status === AD_STATUSES.PAYMENT_REQUIRED && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 font-bold shadow-lg shadow-orange-500/20"
                                                        onClick={() => { setSelectedAd(ad); setShowPaidModal(true); }}
                                                    >
                                                        <CreditCard className="w-4 h-4 mr-2" /> Confirmer Paiement
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9 px-4 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                                                        asChild
                                                    >
                                                        <a href={`https://wa.me/${ad.whatsapp?.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer">
                                                            <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                                        </a>
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                                                <a href={ad.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>Refuser l'annonce</DialogTitle>
                        <DialogDescription>
                            Veuillez indiquer la raison du refus. Cet e-mail sera envoyé à l'étudiant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full min-h-[120px] rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Ex: Image de mauvaise qualité, texte inapproprié..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Annuler</Button>
                        <Button className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={handleReject}>Confirmer le Refus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Modal */}
            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                <DialogContent className="rounded-3xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Approuver l'annonce ?</DialogTitle>
                        <DialogDescription>
                            L'annonce passera en statut "Paiement Requis". Un e-mail sera envoyé à l'étudiant avec les tarifs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" className="rounded-xl" onClick={() => setShowApproveModal(false)}>Annuler</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8" onClick={handleApprove}>Approuver</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Paid Modal */}
            <Dialog open={showPaidModal} onOpenChange={setShowPaidModal}>
                <DialogContent className="rounded-3xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-orange-600" /> Confirmer le Paiement
                        </DialogTitle>
                        <DialogDescription>
                            Marquer cette annonce comme payée. Elle deviendra immédiatement **Live** sur le site et une facture sera générée.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-orange-50 p-4 rounded-xl text-[13px] text-orange-800 border border-orange-100 mt-2">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Assurez-vous d'avoir reçu les {selectedAd?.price} MAD via WhatsApp avant de confirmer.
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="ghost" className="rounded-xl" onClick={() => setShowPaidModal(false)}>Annuler</Button>
                        <Button className="bg-orange-600 hover:bg-orange-700 rounded-xl px-8" onClick={handleMarkAsPaid}>Confirmer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
