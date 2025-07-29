'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

type AssetData = {
    title: string;
    description: string;
    category: '3D' | 'animation' | 'audio';
    engine: 'Unity' | 'Unreal' | 'Other';
    price: number;
    license: 'CC0' | 'commercial';
};

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file.');
            return;
        }

        setError(null);

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (!user || userError) {
            setError('You must be logged in to upload.');
            return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `assets/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file);

        if (uploadError) {
            setError('Error uploading file: ' + uploadError.message);
            return;
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from('assets').getPublicUrl(filePath);

        const assetData: AssetData = {
            title,
            description,
            category,
            engine,
            price: parseFloat(price),
            license,
        };

        const { error: dbError } = await supabase.from('assets').insert({
            ...assetData,
            file_url: publicUrl,
            user_id: user.id,
        });

        if (dbError) {
            setError('Error saving asset metadata: ' + dbError.message);
            return;
        }

        router.push('/dashboard'); // Redirect after success
    };

    return (
        <form onSubmit={handleSubmit}>
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
                    onChange={(e) => setCategory(e.target.value as AssetData['category'])}
                    className="w-full p-2 mb-4 border rounded"
                >
                    <option value="3D">3D</option>
                    <option value="animation">Animation</option>
                    <option value="audio">Audio</option>
                </select>
                <select
                    value={engine}
                    onChange={(e) => setEngine(e.target.value as AssetData['engine'])}
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
                    onChange={(e) => setLicense(e.target.value as AssetData['license'])}
                    className="w-full p-2 mb-4 border rounded"
                >
                    <option value="CC0">CC0 (Free)</option>
                    <option value="commercial">Commercial</option>
                </select>
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Upload
                </button>
            </div>
        </form>
    );
}
