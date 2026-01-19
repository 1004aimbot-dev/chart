import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

export default function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            navigate('/org');
        } else {
            setError('비밀번호가 올바르지 않습니다.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
            <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 w-full max-w-md">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-4 bg-blue-500/10 rounded-full text-blue-400">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold font-serif">관리자 접속</h2>
                    <p className="text-slate-400 text-center">
                        조직 및 출석부 관리를 위해 관리자 권한이 필요합니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="관리자 비밀번호"
                            className="w-full bg-slate-800 border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        접속하기
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/org')}
                        className="w-full text-slate-500 text-sm hover:text-slate-300 py-2"
                    >
                        비회원(열람용)으로 계속하기
                    </button>
                </form>
            </div>
        </div>
    );
}
