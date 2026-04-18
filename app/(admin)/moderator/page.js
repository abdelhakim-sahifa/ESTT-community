import ModeratorDashboard from '@/components/features/admin/ModeratorDashboard';

export const metadata = {
    title: 'Modération | ESTT Community',
    description: 'Espace de modération de la communauté ESTT.',
};

export default function ModeratorPage() {
    return (
        <main className="min-h-screen">
            <ModeratorDashboard />
        </main>
    );
}
