export default function AdminPage() {
    // Dynamically import AdminDashboard to ensure client-side rendering if needed, 
    // but since the component is 'use client', standard import is fine.

    // We'll import it at the top level

    return (
        <main className="container">
            {/* AdminDashboard handles its own auth check and loading state */}
            <AdminDashboard />
        </main>
    );
}

// Importing here for clarity but will actually write the file
import AdminDashboard from '@/components/AdminDashboard';
