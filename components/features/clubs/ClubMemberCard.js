import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { db as staticDb } from '@/lib/data';
import { db, ref, query, orderByChild, equalTo, get } from '@/lib/firebase';
import { getInitials } from '@/lib/clubUtils';
import { Mail, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ClubMemberCard({ member, showPhoto = false }) {
    const [linkedProfile, setLinkedProfile] = useState(null);

    useEffect(() => {
        const fetchLinkedProfile = async () => {
            if (!member.email || !db) return;

            try {
                const usersRef = ref(db, 'users');
                const q = query(usersRef, orderByChild('email'), equalTo(member.email.toLowerCase()));
                const snap = await get(q);
                if (snap.exists()) {
                    const data = snap.val();
                    const userId = Object.keys(data)[0];
                    setLinkedProfile({
                        id: userId,
                        ...data[userId]
                    });
                }
            } catch (error) {
                console.error("Error fetching linked profile:", error);
            }
        };

        fetchLinkedProfile();
    }, [member.email]);

    // Get filiere name from ID
    const getFiliereName = (filiereId) => {
        const filiere = staticDb.fields.find(f => f.id === filiereId);
        return filiere ? filiere.name : filiereId;
    };

    const displayPhoto = member.photo || linkedProfile?.photoUrl;
    const displayName = linkedProfile ? `${linkedProfile.firstName} ${linkedProfile.lastName}` : member.name;

    const CardContentWrapper = (
        <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    {showPhoto && (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 relative">
                            {displayPhoto ? (
                                <Image
                                    src={displayPhoto}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                getInitials(displayName)
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium text-sm truncate">{displayName}</p>
                        </div>
                        {member.email && (
                            <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                        )}
                        {member.filiere && (
                            <Badge variant="secondary" className="text-[10px] mt-1">
                                {getFiliereName(member.filiere)}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (linkedProfile?.id) {
        return (
            <Link href={`/profile/${linkedProfile.id}`} className="block h-full transition-transform hover:-translate-y-1">
                {CardContentWrapper}
            </Link>
        );
    }

    return CardContentWrapper;
}
