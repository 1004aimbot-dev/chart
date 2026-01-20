import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    title: string;
    message?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export default function PromptModal({
    isOpen,
    title,
    message,
    defaultValue = '',
    onConfirm,
    onCancel
}: Props) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            // Focus after a short delay to ensure modal is rendered
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-100">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {message && (
                        <p className="text-slate-400 text-sm">{message}</p>
                    )}

                    <div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="입력하세요"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-colors"
                        >
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
