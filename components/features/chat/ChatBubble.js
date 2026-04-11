import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BadgeCheck, ShieldCheck, Gem, User, SmilePlus } from 'lucide-react';

const COMMON_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮'];

export default function ChatBubble({ message, isOwn, onReact, currentUserId, profile: externalProfile }) {
    const [showPicker, setShowPicker] = useState(false);
    const { userId, text, timestamp, reactions, profile: messageProfile } = message;
    const profile = externalProfile || messageProfile;
    const { firstName, lastName, photoUrl, verifiedEmail, role, subscription } = profile || {};

    const formattedTime = new Date(timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toUpperCase();

    // Badge logic
    const isSubscribed = subscription?.expiresAt && subscription.expiresAt > Date.now();
    const isAdmin = role === 'admin';

    // Reactions logic
    const reactionList = reactions ? Object.entries(reactions).map(([emoji, users]) => ({
        emoji,
        count: Object.keys(users).length,
        hasReacted: users[currentUserId] === true
    })) : [];

    return (
        <div className={cn(
            "flex w-full mb-8 group relative",
            isOwn ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex max-w-[85%] md:max-w-[75%]",
                isOwn ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <Link 
                    href={`/profile/${userId}`}
                    className={cn(
                        "w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-slate-100 border border-slate-200 mt-1 hover:opacity-80 transition-opacity self-start",
                        isOwn ? "ml-3" : "mr-3"
                    )}
                >
                    {photoUrl ? (
                        <Image
                            src={photoUrl}
                            alt={firstName || 'User'}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-6 h-6" />
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className={cn(
                    "flex flex-col relative",
                    isOwn ? "items-end" : "items-start"
                )}>
                    {/* Name & Badges */}
                    <Link 
                        href={`/profile/${userId}`}
                        className={cn(
                            "flex items-center gap-1.5 mb-1.5 hover:opacity-80 transition-opacity",
                            isOwn ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <span className="text-sm font-bold text-slate-800">
                            {firstName} {lastName}
                        </span>
                        
                        {verifiedEmail && (
                            <div className="relative flex items-center">
                                <span 
                                    className={cn(
                                        "material-symbols-outlined select-none text-[18px]",
                                        isAdmin ? "text-yellow-500" : "text-emerald-500"
                                    )} 
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    verified
                                </span>
                            </div>
                        )}

                        {isSubscribed && (
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-500 p-0.5 rounded-sm shadow-sm">
                                <Gem className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </Link>

                    {/* Bubble Container (for Reaction Picker overlap) */}
                    <div className="relative group/bubble">
                        {/* Bubble */}
                        <div className={cn(
                            "rounded-2xl px-6 py-3.5 text-sm md:text-[15px] leading-relaxed relative shadow-sm",
                            isOwn 
                                ? "bg-blue-50 text-slate-800 rounded-tr-none border border-blue-100/50" 
                                : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                        )}>
                            {text}
                        </div>

                        {/* Reaction Picker Trigger */}
                        <button 
                            onClick={() => setShowPicker(!showPicker)}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-100 text-slate-400 hover:text-blue-500 opacity-0 group-hover/bubble:opacity-100 transition-all z-10",
                                isOwn ? "-left-10" : "-right-10"
                            )}
                        >
                            <SmilePlus className="w-4 h-4" />
                        </button>

                        {/* Emoji Picker Popover */}
                        {showPicker && (
                            <div className={cn(
                                "absolute bottom-full mb-3 p-1.5 bg-white rounded-full shadow-2xl border border-slate-100 flex items-center gap-1 z-30 animate-in fade-in zoom-in duration-200",
                                isOwn ? "right-0" : "left-0"
                            )}>
                                {COMMON_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            onReact(emoji);
                                            setShowPicker(false);
                                        }}
                                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-50 rounded-full transition-colors active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reaction Chips */}
                    {reactionList.length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1.5 mt-2",
                            isOwn ? "justify-end" : "justify-start"
                        )}>
                            {reactionList.map(({ emoji, count, hasReacted }) => (
                                <button
                                    key={emoji}
                                    onClick={() => onReact(emoji)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-all border",
                                        hasReacted 
                                            ? "bg-blue-50 border-blue-200 text-blue-600" 
                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                    )}
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wider">
                        {formattedTime}
                    </span>
                </div>
            </div>
        </div>
    );
}
