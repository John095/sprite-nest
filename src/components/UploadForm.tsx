'use client';
import { useState } from 'react';
import { supabaseClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'3D' | 'animation' | 'audio'>('3D');
    const [engine, setEngine] = useState<'Unity' | 'Unreal' | 'Other'>('Unity');
    const [price, setPrice] = useState('0');
    const [license, setLicense] = useState<'CC0' | 'commercial'>('CC0');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('engine', engine);
        formData.append('price', price);
        formData.append('license', license);

        const { data: { session } } = await supabaseClient.auth.getSession();
        const response = await fetch('/api/upload-asset', {
            method: 'POST',
            body: formData,
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });

        if (!response.ok) {
            const { error } = await response.json();
            setError(error);
            return;
        }

        router.push('/assets');
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">Upload Asset to SpriteNest</h1>
            {error && <p className="text-red-500">{error}</p>}
            <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full p-2 mb-4 border rounded"
            />
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full p-2 mb-4 border rounded"
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full p-2 mb-4 border rounded"
            />
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 mb-4 border rounded"
            >
                <option value="3D">3D</option>
                <option value="animation">Animation</option>
                <option value="audio">Audio</option>
            </select>
            <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as any)}
                className="w-full p-2 mb-4 border rounded"
            >
                <option value="Unity">Unity</option>
                <option value="Unreal">Unreal</option>
                <option value="Other">Other</option>
            </select>
            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price (0 for free)"
                className="w-full p-2 mb-4 border rounded"
            />
            <select
                value={license}
                onChange={(e) => setLicense(e.target.value as any)}
                className="w-full p-2 mb-4 border rounded"
            >
                <option value="CC0">CC0 (Free)</option>
                <option value="commercial">Commercial</option>
            </select>
            <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Upload
            </button>
        </div>
    );
}