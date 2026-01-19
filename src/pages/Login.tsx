import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


export default function Login() {
    const navigate = useNavigate();

    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        if (!confirm('정말 데이터베이스를 초기화하시겠습니까? 기존 데이터가 있다면 중복될 수 있습니다.')) return;

        setIsSeeding(true);
        try {
            const m = await import('../utils/seeder');
            await m.seedDatabase();
            alert('초기화 성공! DB에 데이터가 생성되었습니다.');
        } catch (error) {
            console.error(error);
            alert('초기화 실패! 콘솔(F12)을 확인해주세요.\n' + error);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Todo: Implement auth
        navigate('/org');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">성남신광교회</h1>
                    <p className="text-gray-500">관리자 로그인</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="admin@sk-church.or.kr"
                            defaultValue="admin@sk-church.or.kr"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        로그인
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50"
                    >
                        {isSeeding ? '데이터 생성 중...' : '데이터베이스 초기화 (기초 데이터 생성)'}
                    </button>
                </div>
            </div>
        </div>
    );
}
