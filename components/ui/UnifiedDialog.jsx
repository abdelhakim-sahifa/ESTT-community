'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

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

    if (!isOpen) return null;

    // Define icon and color based on type
    const typeConfig = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            titleColor: 'text-green-900',
            messageColor: 'text-green-800',
            iconColor: 'text-green-600'
        },
        error: {
            icon: AlertCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            titleColor: 'text-red-900',
            messageColor: 'text-red-800',
            iconColor: 'text-red-600'
        },
        warning: {
            icon: AlertTriangle,
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            titleColor: 'text-orange-900',
            messageColor: 'text-orange-800',
            iconColor: 'text-orange-600'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            titleColor: 'text-blue-900',
            messageColor: 'text-blue-800',
            iconColor: 'text-blue-600'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const Icon = icon || config.icon;

    const content = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
                role="presentation"
            />

            {/* Dialog */}
            <div
                className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 transform p-4 transition-all duration-300"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
                    {/* Header with icon, title, and close button */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            {type !== 'warning' && (
                                <Icon
                                    className={`mt-0.5 h-6 w-6 flex-shrink-0 ${config.iconColor}`}
                                    strokeWidth={2}
                                />
                            )}
                            <div className="flex-1">
                                {title && (
                                    <h2
                                        id="dialog-title"
                                        className="text-lg font-bold text-gray-900 leading-tight"
                                    >
                                        {title}
                                    </h2>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            aria-label="Close dialog"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Description */}
                    {message && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                            {message}
                        </p>
                    )}

                    {/* Actions Footer */}
                    {actions.length > 0 && (
                        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            {actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick?.();
                                        onClose?.();
                                    }}
                                    className={getButtonStyles(action.variant)}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // Only render if we are on the client
    if (typeof window === 'undefined') return null;

    return createPortal(content, document.body);
}

function getButtonStyles(variant = 'primary') {
    const baseStyles = 'px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    switch (variant) {
        case 'primary':
            return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
        case 'secondary':
            return `${baseStyles} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500`;
        case 'danger':
            return `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
        default:
            return `${baseStyles} bg-gray-200 text-gray-800 hover:bg-gray-300`;
    }
}
