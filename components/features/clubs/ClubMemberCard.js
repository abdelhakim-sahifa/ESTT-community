import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { db as staticDb } from '@/lib/data';
import { getInitials } from '@/lib/clubUtils';
import { Mail, User } from 'lucide-react';

export default function ClubMemberCard({ member, showPhoto = false }) {
    // Get filiere name from ID
    const getFiliereName = (filiereId) => {
        const filiere = staticDb.fields.find(f => f.id === filiereId);
        return filiere ? filiere.name : filiereId;
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    {showPhoto && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                            {getInitials(member.name)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium text-sm truncate">{member.name}</p>
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
}
