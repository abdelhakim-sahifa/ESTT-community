import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ClubCard({ club }) {
    const truncateDescription = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    return (
        <Link href={`/clubs/${club.id}`}>
            <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer border-muted-foreground/10">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                            {club.logo ? (
                                <Image
                                    src={club.logo}
                                    alt={`${club.name} logo`}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                                    style={{ color: club.themeColor || '#64748b' }}
                                >
                                    {club.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                                <CardTitle
                                    className="text-lg leading-tight transition-colors line-clamp-2"
                                    style={{ '--theme-color': club.themeColor || '#64748b' }}
                                >
                                    <span className="group-hover:text-[var(--theme-color)] transition-colors">
                                        {club.name}
                                    </span>
                                </CardTitle>
                                {club.verified && (
                                    <Badge variant="default" className="flex-shrink-0 gap-1 bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded-full border-0 shadow-sm">
                                        <i className="fa-solid fa-circle-check text-[10px]"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Vérifié</span>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardDescription className="line-clamp-3 text-sm">
                        {truncateDescription(club.description, 120)}
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}
