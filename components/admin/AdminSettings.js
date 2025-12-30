import { useState } from 'react';
import { db, ref, update } from '@/lib/firebase';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function AdminSettings({ settings, setSettings }) {
    const [savingSettings, setSavingSettings] = useState(false);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await update(ref(db, 'adminSettings/notifications'), settings);
            alert("Paramètres de notification mis à jour !");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Paramètres</h1>
                    <p className="text-muted-foreground">Configurez les notifications et autres préférences.</p>
                </div>
            </div>

            <Card className="max-w-2xl border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Notifications par Email</CardTitle>
                    <CardDescription>
                        Recevez un email lorsque de nouvelles données nécessitent votre attention (nouvelles ressources, demandes de clubs, etc.).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        <div className="flex items-center space-x-2 border p-4 rounded-md bg-slate-50">
                            <input
                                type="checkbox"
                                id="notifEnabled"
                                checked={settings.enabled}
                                onChange={(e) => setSettings(p => ({ ...p, enabled: e.target.checked }))}
                                className="w-4 h-4"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="notifEnabled"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Activer les notifications
                                </label>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Si désactivé, vous ne recevrez aucun email automatique d'alerte.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email de réception</label>
                            <Input
                                type="email"
                                value={settings.email}
                                onChange={(e) => setSettings(p => ({ ...p, email: e.target.value }))}
                                placeholder="exemple@email.com"
                                required={settings.enabled}
                                disabled={!settings.enabled}
                            />
                            <p className="text-xs text-muted-foreground">
                                Par défaut : thevcercle@gmail.com
                            </p>
                        </div>

                        <Button type="submit" disabled={savingSettings}>
                            {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Sauvegarder les préférences
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
