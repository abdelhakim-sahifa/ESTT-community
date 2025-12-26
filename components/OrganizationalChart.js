import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/clubUtils';
import { db as staticDb } from '@/lib/data';
import Image from 'next/image';

export default function OrganizationalChart({ organizationalChart }) {
    if (!organizationalChart || Object.keys(organizationalChart).length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Aucune structure organisationnelle définie
            </div>
        );
    }

    // Define hierarchy levels
    const hierarchy = {
        level1: ['president'],
        level2: ['vicePresident'],
        level3: ['secretary', 'treasurer'],
        level4: ['technicalLead', 'communicationLead', 'eventCoordinator']
    };

    // Get filiere name from ID
    const getFiliereName = (filiereId) => {
        const filiere = staticDb.fields.find(f => f.id === filiereId);
        return filiere ? filiere.name : filiereId;
    };

    // Get role display name
    const getRoleDisplay = (key, customRole) => {
        if (customRole) return customRole;

        const roleNames = {
            president: 'Président(e)',
            vicePresident: 'Vice-Président(e)',
            secretary: 'Secrétaire',
            treasurer: 'Trésorier(ère)',
            technicalLead: 'Responsable Technique',
            communicationLead: 'Responsable Communication',
            eventCoordinator: 'Coordinateur(trice) Événements'
        };

        return roleNames[key] || key;
    };

    // Render a member card
    const MemberCard = ({ member, positionKey }) => (
        <Card className="text-center hover:shadow-lg transition-shadow border-primary/20">
            <CardContent className="pt-6 pb-4 px-4">
                <div className="flex flex-col items-center gap-3">
                    {/* Avatar */}
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30">
                        {member.photo ? (
                            <Image
                                src={member.photo}
                                alt={member.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary">
                                {getInitials(member.name)}
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm leading-tight">{member.name}</h4>
                        <p className="text-xs font-medium text-primary">
                            {getRoleDisplay(positionKey, member.role)}
                        </p>
                    </div>

                    {/* Filiere Badge */}
                    {member.filiere && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                            {getFiliereName(member.filiere)}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Render a level of the hierarchy
    const renderLevel = (levelKeys) => {
        const members = levelKeys
            .map(key => organizationalChart[key] ? { ...organizationalChart[key], key } : null)
            .filter(Boolean);

        if (members.length === 0) return null;

        return (
            <div className={`grid gap-4 ${members.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                    members.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-md mx-auto' :
                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                {members.map(member => (
                    <MemberCard key={member.key} member={member} positionKey={member.key} />
                ))}
            </div>
        );
    };

    // Collect any custom positions not in predefined hierarchy
    const allPredefinedKeys = Object.values(hierarchy).flat();
    const customPositions = Object.entries(organizationalChart)
        .filter(([key]) => !allPredefinedKeys.includes(key))
        .map(([key, data]) => ({ ...data, key }));

    return (
        <div className="space-y-8">
            {/* Level 1: President */}
            {renderLevel(hierarchy.level1)}

            {/* Connector */}
            {organizationalChart.president && (organizationalChart.vicePresident || hierarchy.level3.some(k => organizationalChart[k])) && (
                <div className="flex justify-center">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-primary/20"></div>
                </div>
            )}

            {/* Level 2: Vice President */}
            {renderLevel(hierarchy.level2)}

            {/* Connector */}
            {organizationalChart.vicePresident && hierarchy.level3.some(k => organizationalChart[k]) && (
                <div className="flex justify-center">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-primary/20"></div>
                </div>
            )}

            {/* Level 3: Secretary & Treasurer */}
            {renderLevel(hierarchy.level3)}

            {/* Connector */}
            {hierarchy.level3.some(k => organizationalChart[k]) && hierarchy.level4.some(k => organizationalChart[k]) && (
                <div className="flex justify-center">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-primary/20"></div>
                </div>
            )}

            {/* Level 4: Other leads */}
            {renderLevel(hierarchy.level4)}

            {/* Custom positions */}
            {customPositions.length > 0 && (
                <>
                    <div className="flex justify-center">
                        <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-primary/20"></div>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {customPositions.map(member => (
                            <MemberCard key={member.key} member={member} positionKey={member.key} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
