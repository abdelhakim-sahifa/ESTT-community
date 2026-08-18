import { db, ref, get } from './firebase';

export async function searchResourcesAction(rawQuery, userField = null) {
    if (!db) return [];

    try {
        const query = rawQuery.toLowerCase().trim();
        const queryWords = query.split(/\s+/).filter(w => w.length > 2);
        const resourcesRef = ref(db, 'resources');
        const snapshot = await get(resourcesRef);

        if (!snapshot.exists()) return [];

        const allResources = snapshot.val();
        const results = Object.entries(allResources)
            .map(([id, data]) => ({ id, ...data }))
            .filter(res => {
                if (res.unverified === true) return false;
                if (!res.title) return false;

                const title = res.title.toLowerCase();
                const desc = (res.description || '').toLowerCase();
                const mod = (res.module || '').toLowerCase();
                const prof = (res.professor || '').toLowerCase();

                const titleMatch = queryWords.some(w => title.includes(w));
                const descMatch = queryWords.some(w => desc.includes(w));
                const moduleMatch = queryWords.some(w => mod.includes(w));
                const professorMatch = queryWords.some(w => prof.includes(w));
                const fieldsMatch = res.fields && Array.isArray(res.fields) &&
                    res.fields.some(f => {
                        const name = (f.name || f.moduleName || '').toLowerCase();
                        const id = (f.moduleId || f.id || '').toLowerCase();
                        return queryWords.some(w => name.includes(w) || id.includes(w));
                    });

                const isMatch = titleMatch || descMatch || moduleMatch || professorMatch || fieldsMatch;
                if (!isMatch) return false;

                if (userField) {
                    const matchesField = res.field === userField ||
                        (res.fields && Array.isArray(res.fields) && res.fields.some(f => f.id === userField || f.fieldId === userField));
                    return matchesField;
                }

                return true;
            });

        return results.slice(0, 10).map(res => ({
            id: res.id,
            title: res.title,
            description: res.description || '',
            module: res.module || '',
            professor: res.professor || '',
            type: res.type || '',
            docType: res.docType || '',
            field: res.field || null,
            file: res.file || null,
            url: res.url || res.link || null,
        }));
    } catch (error) {
        console.error('Error in searchResourcesAction:', error);
        return [];
    }
}
