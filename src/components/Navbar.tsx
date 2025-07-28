'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase/client';

import { User } from '../lib/types';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            setUser(user);
        };
        fetchUser();
        const { data: authListener } = supabaseClient.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        setUser(null);
    };

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-2xl font-bold">
                    SpriteNest
                </Link>
                <div className="space-x-4">
                    <Link href="/assets" className="text-white hover:text-gray-300">
                        Browse Assets
                    </Link>
                    {user ? (
                        <>
                            <Link href="/upload" className="text-white hover:text-gray-300">
                                Upload Asset
                            </Link>
                            <button onClick={handleLogout} className="text-white hover:text-gray-300">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-white hover:text-gray-300">
                                Login
                            </Link>
                            <Link href="/signup" className="text-white hover:text-gray-300">
                                Signup
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}