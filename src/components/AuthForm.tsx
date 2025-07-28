'use client';
import { useState } from 'react';
import { supabaseClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
    type: 'login' | 'signup';
}

export default function AuthForm({ type }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setError(null);
        if (type === 'signup') {
            const { error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { username } },
            });
            if (error) {
                setError(error.message);
                return;
            }
        } else {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
                return;
            }
        }
        router.push('/assets');
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">
                {type === 'signup' ? 'Sign Up for SpriteNest' : 'Login to SpriteNest'}
            </h1>
            {error && <p className="text-red-500">{error}</p>}
            {type === 'signup' && (
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full p-2 mb-4 border rounded"
                />
            )}
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 mb-4 border rounded"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-2 mb-4 border rounded"
            />
            <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                {type === 'signup' ? 'Sign Up' : 'Login'}
            </button>
        </div>
    );
}