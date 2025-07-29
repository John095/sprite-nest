// src/components/AssetGrid.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

type Asset = {
    id: string;
    title: string;
    description: string | null;
    category: string;
    engine: string | null;
    license: string | null;
    thumbnail_url?: string | null;
    file_url: string | null;
    price?: number | null;
    created_at: string | null;
    user_id: string;
};


export default function AssetGrid() {
    const [assets, setAssets] = useState<Asset[]>([]); // Initialize as empty array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();

    // Check authentication status
    useEffect(() => {
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null);
                setAuthLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleLogin = () => {
        router.push('/login');
    };

    const handleSignup = () => {
        router.push('/signup');
    };

    const handleUpload = () => {
        if (!user) {
            router.push('/login?redirect=/upload');
        } else {
            router.push('/upload');
        }
    };

    useEffect(() => {
        fetchAssets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false });

            // Add category filter if not 'all'
            if (selectedCategory !== 'all') {
                query = query.eq('category', selectedCategory);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            // Ensure data is an array
            setAssets(data || []);
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch assets');
            setAssets([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (assetId: string, fileName?: string) => {
        try {
            // First get the asset details including file_url
            const { data: asset, error: assetError } = await supabase
                .from('assets')
                .select('file_url, title, category')
                .eq('id', assetId)
                .single();

            if (assetError || !asset) {
                throw new Error('Asset not found or error fetching asset details');
            }

            if (!asset.file_url) {
                throw new Error('No file URL found for this asset');
            }

            // Log the download if user is authenticated
            if (user) {
                const { error: downloadLogError } = await supabase
                    .from('downloads')
                    .insert({
                        asset_id: assetId,
                        user_id: user.id
                    });

                if (downloadLogError) {
                    console.error('Error logging download:', downloadLogError);
                }
            }

            // Show loading state
            const downloadButton = document.querySelector(`[data-asset-id="${assetId}"]`) as HTMLButtonElement;
            if (downloadButton) {
                downloadButton.disabled = true;
                downloadButton.textContent = 'Downloading...';
            }

            // For Supabase Storage files, use signed URL method
            if (asset.file_url.includes('supabase')) {
                try {
                    // Extract the file path from the URL
                    const urlParts = asset.file_url.split('/');
                    const objectIndex = urlParts.findIndex(part => part === 'object');

                    if (objectIndex !== -1) {
                        // Get the path after /object/public/assets/
                        const pathAfterObject = urlParts.slice(objectIndex + 1).join('/');
                        const filePath = pathAfterObject.replace('public/assets/', '');

                        // Create a signed URL for download (this preserves original file type)
                        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                            .from('assets')
                            .createSignedUrl(filePath, 60, {
                                download: true // This forces download instead of opening in browser
                            });

                        if (signedUrlError) {
                            throw signedUrlError;
                        }

                        if (signedUrlData?.signedUrl) {
                            // Use the signed URL to trigger download
                            const originalFileName = getOriginalFileName(filePath) || `${asset.title}`;
                            await downloadFileFromUrl(signedUrlData.signedUrl, originalFileName);
                            console.log('Supabase signed URL download completed');
                            return;
                        }
                    }

                    // Fallback: try direct storage download
                    const pathParts = asset.file_url.split('/assets/');
                    if (pathParts.length > 1) {
                        const filePath = pathParts[1];

                        const { data: fileData, error: downloadError } = await supabase.storage
                            .from('assets')
                            .download(filePath);

                        if (downloadError) {
                            throw downloadError;
                        }

                        // Create blob with proper MIME type
                        const originalFileName = getOriginalFileName(filePath) || `${asset.title}`;
                        const extension = getFileExtension(filePath);
                        const mimeType = getMimeTypeFromExtension(extension);

                        const blob = new Blob([fileData], { type: mimeType });
                        downloadBlob(blob, originalFileName);
                        console.log('Supabase storage download completed');
                        return;
                    }

                } catch (storageError) {
                    console.warn('Supabase storage download failed, trying direct URL method:', storageError);
                }
            }

            // Method 2: Direct URL download with proper headers
            const originalFileName = getOriginalFileName(asset.file_url) || `${asset.title}`;
            await downloadFileFromUrl(asset.file_url, originalFileName);

        } catch (err) {
            console.error('Download error:', err);
            alert(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            // Reset button state
            const downloadButton = document.querySelector(`[data-asset-id="${assetId}"]`) as HTMLButtonElement;
            if (downloadButton) {
                downloadButton.disabled = false;
                downloadButton.textContent = 'Download';
            }
        }
    };

    // Enhanced function to download file from URL with proper MIME type handling
    const downloadFileFromUrl = async (fileUrl: string, fileName: string) => {
        try {
            // Use fetch with proper headers to preserve file type
            const response = await fetch(fileUrl, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the actual MIME type from response headers
            const contentType = response.headers.get('content-type') || 'application/octet-stream';

            // Get file as array buffer to preserve binary data
            const arrayBuffer = await response.arrayBuffer();

            // Create blob with proper MIME type
            const blob = new Blob([arrayBuffer], { type: contentType });

            // Ensure filename has proper extension
            const finalFileName = ensureProperExtension(fileName, contentType, fileUrl);

            downloadBlob(blob, finalFileName);
            console.log('Direct URL download completed with MIME type:', contentType);

        } catch (error) {
            console.error('Direct download error:', error);
            // Last resort: open in new tab
            const link = document.createElement('a');
            link.href = fileUrl;
            link.target = '_blank';
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Function to download blob with proper filename
    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Get original filename from path/URL
    const getOriginalFileName = (pathOrUrl: string): string => {
        try {
            const parts = pathOrUrl.split('/');
            const lastPart = parts[parts.length - 1];
            // Remove query parameters
            return lastPart.split('?')[0];
        } catch {
            return '';
        }
    };

    // Ensure filename has proper extension based on MIME type
    const ensureProperExtension = (fileName: string, mimeType: string, originalUrl: string): string => {
        const hasExtension = fileName.includes('.');

        if (hasExtension) {
            return fileName;
        }

        // Try to get extension from original URL
        const urlExtension = getFileExtension(originalUrl);
        if (urlExtension) {
            return fileName + urlExtension;
        }

        // Get extension from MIME type
        const mimeExtension = getExtensionFromMimeType(mimeType);
        return fileName + mimeExtension;
    };

    // Get MIME type from file extension
    const getMimeTypeFromExtension = (extension: string): string => {
        const extToMime: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.avi': 'video/x-msvideo',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
            '.7z': 'application/x-7z-compressed',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.gltf': 'model/gltf+json',
            '.glb': 'model/gltf-binary',
            '.obj': 'text/plain',
            '.fbx': 'application/octet-stream',
            '.blend': 'application/octet-stream',
            '.max': 'application/octet-stream',
            '.psd': 'image/vnd.adobe.photoshop',
            '.ai': 'application/postscript',
            '.exe': 'application/x-msdownload',
            '.dmg': 'application/x-apple-diskimage',
            '.apk': 'application/vnd.android.package-archive'
        };

        return extToMime[extension.toLowerCase()] || 'application/octet-stream';
    };

    // Helper function to extract file extension from path
    const getFileExtension = (filePath: string): string => {
        const lastDot = filePath.lastIndexOf('.');
        const lastSlash = filePath.lastIndexOf('/');

        // Make sure the dot is after the last slash (not part of a directory name)
        if (lastDot !== -1 && lastDot > lastSlash) {
            return filePath.substring(lastDot);
        }
        return '';
    };

    // Helper function to get extension from MIME type
    const getExtensionFromMimeType = (mimeType: string | null): string => {
        if (!mimeType) return '';

        const mimeToExt: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'audio/mpeg': '.mp3',
            'audio/wav': '.wav',
            'audio/ogg': '.ogg',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/x-msvideo': '.avi',
            'application/zip': '.zip',
            'application/x-rar-compressed': '.rar',
            'application/x-7z-compressed': '.7z',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt',
            'application/json': '.json',
            'model/gltf+json': '.gltf',
            'model/gltf-binary': '.glb',
            'application/octet-stream': '.bin',
            'image/vnd.adobe.photoshop': '.psd',
            'application/postscript': '.ai',
            'application/x-msdownload': '.exe',
            'application/x-apple-diskimage': '.dmg',
            'application/vnd.android.package-archive': '.apk'
        };

        return mimeToExt[mimeType.toLowerCase()] || '';
    };

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading assets...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                    <button
                        onClick={fetchAssets}
                        className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header with Authentication */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Game Assets</h1>

                {/* Authentication Section */}
                <div className="flex items-center space-x-4">
                    {authLoading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : user ? (
                        // Authenticated user menu
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                Welcome, {user.email}
                            </span>
                            <button
                                onClick={handleUpload}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                            >
                                Upload Asset
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        // Guest user buttons
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleLogin}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleSignup}
                                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                            >
                                Sign Up
                            </button>
                            <button
                                onClick={handleUpload}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                            >
                                Upload Asset
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                    Filter by Category:
                </label>
                <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                >
                    <option value="all">All Categories</option>
                    <option value="3d">3D Models</option>
                    <option value="animation">Animations</option>
                    <option value="audio">Audio</option>
                    <option value="texture">Textures</option>
                    <option value="sprite">Sprites</option>
                </select>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Check if assets is an array and has items */}
                {Array.isArray(assets) && assets.length > 0 ? (
                    assets.map((asset) => (
                        <div key={asset.id} className="p-4 border rounded shadow hover:shadow-lg transition-shadow">
                            {/* Thumbnail */}
                            {asset.thumbnail_url && (
                                <Image
                                    src={asset.thumbnail_url}
                                    alt={asset.title}
                                    className="w-full h-48 object-cover rounded mb-4"
                                />
                            )}

                            <h3 className="text-lg font-bold mb-2">{asset.title}</h3>
                            <p className="text-gray-600 mb-2">{asset.description}</p>

                            <div className="flex justify-between items-center mb-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {asset.category}
                                </span>
                                {asset.engine && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                        {asset.engine}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">
                                    {(asset.price ?? 0) > 0 ? `${asset.price}` : 'Free'}
                                </span>
                                <button
                                    onClick={() => handleDownload(asset.id, asset.title)}
                                    data-asset-id={asset.id}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!user ? 'Login to track downloads' : 'Download asset'}
                                >
                                    Download
                                </button>
                            </div>

                            {asset.license && (
                                <p className="text-xs text-gray-500 mt-2">License: {asset.license}</p>
                            )}
                        </div>
                    ))
                ) : (
                    // No assets found
                    <div className="col-span-full text-center py-12">
                        <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-4l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <h3 className="text-lg font-medium">No assets found</h3>
                            <p className="text-gray-400">
                                {selectedCategory === 'all'
                                    ? 'No assets have been uploaded yet.'
                                    : `No assets found in the "${selectedCategory}" category.`
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}