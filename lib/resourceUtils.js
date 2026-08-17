import { db, ref, get } from './firebase';

export async function searchResourcesAction(rawQuery, userField = null) {
    if (!db) return [];

    try {
        const query = rawQuery.toLowerCase().trim();
        const resourcesRef = ref(db, 'resources');
        const snapshot = await get(resourcesRef);

        if (!snapshot.exists()) return [];

        const allResources = snapshot.val();
        const results = Object.entries(allResources)
            .map(([id, data]) => ({ id, ...data }))
            .filter(res => {
                if (res.unverified === true) return false;
                if (!res.title) return false;

                const titleMatch = res.title.toLowerCase().includes(query);
                const descMatch = res.description?.toLowerCase().includes(query);
                const moduleMatch = res.module?.toLowerCase().includes(query);
                const professorMatch = res.professor?.toLowerCase().includes(query);
                const fieldsMatch = res.fields && Array.isArray(res.fields) &&
                    res.fields.some(f => {
                        const name = f.name || f.moduleName || '';
                        const id = f.moduleId || f.id || '';
                        return name.toLowerCase().includes(query) || id.toLowerCase().includes(query);
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
