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
import { ExternalLink } from 'lucide-react';

export default function AdminUsers({ users }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Utilisateurs</h1>
                    <p className="text-muted-foreground">Liste des membres de la communauté.</p>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Nom</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Email</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Filière</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Rôle</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-bold text-sm">{u.firstName} {u.lastName}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                                <TableCell className="text-xs font-bold uppercase">{u.filiere}</TableCell>
                                <TableCell>
                                    <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-[8px] font-black uppercase tracking-tighter">
                                        {u.role || 'Étudiant'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" asChild>
                                        <a href={`/profile/${u.id}`} target="_blank"><ExternalLink className="w-4 h-4" /></a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
