'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, ref, update } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function ChatTermsDialog() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!user || !profile) return null;
    if (profile.hasAcceptedChatTerms === true) return null;

    const handleAccept = async () => {
        setLoading(true);
        try {
            await update(ref(db, 'users/' + user.uid), {
                hasAcceptedChatTerms: true
            });
        } catch (error) {
            console.error('Error accepting terms:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto shrink-0">
                    <ShieldAlert className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-center mb-4 text-slate-900">Bienvenue dans l'espace discussion</h2>
                <div className="space-y-4 text-xs md:text-sm text-slate-600 mb-8 leading-relaxed">
                    <p>
                        Afin de garantir la meilleure expérience et de développer de nouveaux outils pour la communauté, nous tenons à vous informer sur la politique de gestion de vos échanges :
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Discussions de groupe :</strong> Ces messages ne sont pas chiffrés. En y participant, vous consentez à ce qu'ils puissent être utilisés pour l'entraînement de nos modèles d'intelligence artificielle (ex. modèle linguistique en darija).</li>
                        <li><strong>Messages directs (DMs) :</strong> Ces conversations bénéficient d'un chiffrement de bout en bout. Seuls vous et votre interlocuteur y avez accès. Elles ne seront en aucun cas lues, analysées, ni exploitées.</li>
                    </ul>
                </div>
                <Button 
                    onClick={handleAccept} 
                    disabled={loading}
                    className="w-full rounded-xl h-12 text-base font-bold transition-all"
                >
                    {loading ? 'Validation...' : 'J\'accepte et je continue'}
                </Button>
            </div>
        </div>
    );
}
