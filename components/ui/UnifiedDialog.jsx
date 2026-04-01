'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function UnifiedDialog({
    isOpen,
    type = 'info',
    title,
    message,
    actions = [],
    onClose,
    autoClose,
    icon
}) {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose?.();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, onClose]);

    // Define icon and color based on type
    const typeConfig = {
        success: {
            icon: CheckCircle,
            iconColor: 'text-emerald-500'
        },
        error: {
            icon: AlertCircle,
            iconColor: 'text-rose-500'
        },
        warning: {
            icon: AlertTriangle,
            iconColor: 'text-amber-500'
        },
        info: {
            icon: Info,
            iconColor: 'text-sky-500'
        },
        danger: {
            icon: AlertTriangle,
            iconColor: 'text-rose-500'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const Icon = icon || config.icon;

    // Map legacy variants to standard Button variants
    const getButtonVariant = (variant) => {
        switch (variant) {
            case 'primary': return 'default';
            case 'secondary': return 'outline';
            case 'danger': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose?.();
        }}>
            <DialogContent className="sm:max-w-[400px] border-none shadow-xl rounded-2xl p-6">
                <DialogHeader className="space-y-3">
                    <div className="flex gap-4">
                        <Icon
                            className={`h-6 w-6 shrink-0 ${config.iconColor}`}
                            strokeWidth={2}
                        />
                        <div className="space-y-1">
                            {title && (
                                <DialogTitle className="text-lg font-bold text-left leading-tight">
                                    {title}
                                </DialogTitle>
                            )}
                            {message && (
                                <DialogDescription className="text-left text-sm text-slate-500 leading-relaxed">
                                    {message}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {actions.length > 0 && (
                    <DialogFooter className="mt-6 flex sm:justify-end gap-2">
                        {actions.map((action, idx) => (
                            <Button
                                key={idx}
                                variant={getButtonVariant(action.variant)}
                                className={`rounded-lg px-5 h-10 text-sm font-semibold transition-all ${action.variant === 'danger' || type === 'danger' ? 'destructive' : ''
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick?.();
                                    onClose?.();
                                }}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
