'use client';
import { useState, useEffect } from 'react';
import { Asset } from '../lib/types';
import { supabaseClient } from '../lib/supabase/client';

export default function AssetGrid() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string>('');

    useEffect(() => {
        async function fetchAssets() {
            const url = category ? `/api/assets?category=${category}` : '/api/assets';
            const res = await fetch(url);
            const data: Asset[] = await res.json();
            setAssets(data);
            setLoading(false);
        }
        fetchAssets();
    }, [category]);

    const handleDownload = async (assetId: string) => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ assetId }),
        });
        // Redirect to asset file_url or use signed URL
    };

    if (loading) return <p className="text-center">Loading...</p>;

    return (
        <div>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mb-4 p-2 border rounded"
            >
                <option value="">All Categories</option>
                <option value="3D">3D</option>
                <option value="animation">Animation</option>
                <option value="audio">Audio</option>
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {assets.map((asset) => (
                    <div key={asset.id} className="p-4 border rounded shadow">
                        <h3 className="text-lg font-bold">{asset.title}</h3>
                        <p>{asset.description}</p>
                        <p>Engine: {asset.engine}</p>
                        <p>Price: {asset.price === 0 ? 'Free' : `$${asset.price}`}</p>
                        <button
                            onClick={() => handleDownload(asset.id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Download
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}