import { useRef, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = '확인',
    cancelText = '취소',
    isDanger = false
}: Props) {
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus confirm button for quick access
            setTimeout(() => confirmButtonRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        {isDanger && <AlertTriangle className="text-red-500" size={20} />}
                        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 relative">
                    <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-5 pt-2 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-white rounded-xl font-medium shadow-lg transition-colors flex justify-center items-center gap-2
                            ${isDanger
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
