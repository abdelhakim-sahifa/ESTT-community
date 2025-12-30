import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function RejectionDialog({ open, onOpenChange, onConfirm, isSubmitting, reason, setReason }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Motif du rejet</DialogTitle>
                    <DialogDescription>
                        Veuillez indiquer la raison pour laquelle vous rejetez cet élément. Cette raison sera envoyée par email à l'utilisateur.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <textarea
                        className="w-full min-h-[100px] p-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ex: Le fichier est illisible..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Annuler
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={!reason.trim() || isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmer le rejet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
