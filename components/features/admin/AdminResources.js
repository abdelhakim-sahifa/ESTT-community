import { useState } from 'react';
import { db, ref, update, remove, get } from '@/lib/firebase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle2, Eye, Trash2 } from 'lucide-react';
import RejectionDialog from './RejectionDialog';

export default function AdminResources({ resources }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [itemToReject, setItemToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const filteredResources = resources.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.module?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleApproveResource = async (resource) => {
        try {
            // Determine the path based on the flag we set in the listener
            let path = `resources/${resource.id}`;
            if (resource._isNested && resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }
            await update(ref(db, path), { unverified: null });

            // Sync with user profile if authorId exists
            if (resource.authorId) {
                const profileContribPath = `users/${resource.authorId}/contributions/${resource.id}`;
                await update(ref(db, profileContribPath), { unverified: null });

                // Send Resource Approved Email
                try {
                    // Fetch user email first
                    const userSnap = await get(ref(db, `users/${resource.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceApprovedEmail } = await import('@/lib/email-templates');
                            const resourceUrl = `https://estt-community.vercel.app/resources/${resource.id}`;
                            const html = resourceApprovedEmail(userData.firstName || 'Étudiant', resource.title, resourceUrl);

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Ta ressource est en ligne !',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send resource approval email:", err);
                }
            }

            alert("Ressource approuvée !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'approbation.");
        }
    };

    const handleDeleteResource = (resource) => {
        setItemToReject(resource);
        setRejectionReason('');
        setRejectionModalOpen(true);
    };

    const confirmRejection = async () => {
        if (!itemToReject) return;
        setRejecting(true);

        const resource = itemToReject;
        const reason = rejectionReason;

        try {
            let path = `resources/${resource.id}`;
            if (resource._isNested && resource.moduleId) {
                path = `resources/${resource.moduleId}/${resource.id}`;
            }

            await remove(ref(db, path));

            // Sync with user profile if authorId exists
            if (resource.authorId) {
                const profileContribPath = `users/${resource.authorId}/contributions/${resource.id}`;
                await remove(ref(db, profileContribPath));

                // Send Resource Rejected Email
                try {
                    // Fetch user email first
                    const userSnap = await get(ref(db, `users/${resource.authorId}`));
                    if (userSnap.exists()) {
                        const userData = userSnap.val();
                        if (userData.email) {
                            const { resourceRejectedEmail } = await import('@/lib/email-templates');
                            const html = resourceRejectedEmail(userData.firstName || 'Étudiant', resource.title, reason);

                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: userData.email,
                                    subject: 'Mise à jour concernant ta contribution',
                                    html: html
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send resource rejection email:", err);
                }
            }

            // Cleanup Keywords
            if (resource.field) {
                const keywordPath = `metadata/keywords/${resource.field}/${resource.id}`;
                await remove(ref(db, keywordPath));
            }
            // toast success?
        } catch (err) {
            console.error(err);
            alert("Une erreur est survenue lors du rejet.");
        } finally {
            setRejecting(false);
            setRejectionModalOpen(false);
            setItemToReject(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Gestion des Ressources</h1>
                    <p className="text-muted-foreground">Approuvez, modifiez ou supprimez les ressources partagées.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        className="pl-9 h-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Titre</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Module</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Auteur</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResources.map((res) => (
                            <TableRow key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-bold text-sm">{res.title}</TableCell>
                                <TableCell className="text-xs text-muted-foreground font-medium uppercase">{res.module}</TableCell>
                                <TableCell className="text-xs font-bold">{res.authorName || 'Anonyme'}</TableCell>
                                <TableCell>
                                    {res.unverified ? (
                                        <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter">En attente</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter text-green-600 border-green-100">Vérifié</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {res.unverified && (
                                            <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-100 hover:bg-green-50" onClick={() => handleApproveResource(res)}>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" className="h-8 px-2" asChild>
                                            <a href={res.url || res.link || res.file} target="_blank"><Eye className="w-4 h-4" /></a>
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-destructive border-destructive/10 hover:bg-destructive/5" onClick={() => handleDeleteResource(res)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <RejectionDialog
                open={rejectionModalOpen}
                onOpenChange={setRejectionModalOpen}
                onConfirm={confirmRejection}
                isSubmitting={rejecting}
                reason={rejectionReason}
                setReason={setRejectionReason}
            />
        </div>
    );
}
