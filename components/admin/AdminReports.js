import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminReports({ reports }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Signalements</h1>
                    <p className="text-muted-foreground">Contenu signalé par les utilisateurs.</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Aucun signalement</h3>
                    <p className="text-muted-foreground text-sm">Tout semble en ordre pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reports.map((report) => (
                        <Card key={report.id} className="border-none shadow-sm">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{report.reason}</p>
                                        <p className="text-xs text-muted-foreground">Signalé par {report.reporterName} • {new Date(report.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">Ignorer</Button>
                                    <Button variant="destructive" size="sm">Supprimer le contenu</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
