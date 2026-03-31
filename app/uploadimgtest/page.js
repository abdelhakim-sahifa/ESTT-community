'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { uploadToImgBB } from '@/lib/uploadUtils';

export default function UploadImgTestPage() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 32 * 1024 * 1024) {
                setError('Le fichier est trop volumineux (max 32MB)');
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError('');
            setUploadedUrl('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');
        
        try {
            const url = await uploadToImgBB(file);
            setUploadedUrl(url);
        } catch (err) {
            setError(err.message || 'Erreur lors de l\'envoi.');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(uploadedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clearSelection = () => {
        setFile(null);
        setPreview(null);
        setUploadedUrl('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">ImgBB Test Upload</h1>
                    <p className="text-slate-600">Testez l'envoi d'images vers ImgBB et récupérez l'URL publique.</p>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Sélecteur d'image
                        </CardTitle>
                        <CardDescription>
                            Sélectionnez une image à héberger publiquement.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {!preview ? (
                            <div 
                                className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                                onClick={() => document.getElementById('file-upload').click()}
                            >
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary" />
                                </div>
                                <p className="text-slate-600 font-medium">Cliquez pour choisir un fichier</p>
                                <p className="text-slate-400 text-sm mt-1">PNG, JPG, GIF jusqu'à 32MB</p>
                                <input 
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={onFileChange}
                                />
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[300px]">
                                <img 
                                    src={preview} 
                                    alt="Prévisualisation" 
                                    className="max-h-[500px] object-contain"
                                />
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-4 right-4 rounded-full shadow-lg"
                                    onClick={clearSelection}
                                    disabled={uploading}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                                        <p className="text-slate-900 font-bold">Envoi en cours...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erreur</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {uploadedUrl && !uploading && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4 animate-in fade-in duration-500">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <Check className="w-5 h-5" />
                                    Téléchargement réussi !
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-emerald-800">URL Publique</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            readOnly 
                                            value={uploadedUrl} 
                                            className="bg-white border-emerald-200 focus-visible:ring-emerald-500"
                                        />
                                        <Button 
                                            onClick={copyToClipboard}
                                            variant={copied ? "outline" : "default"}
                                            className={copied ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-emerald-600 hover:bg-emerald-700"}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between items-center border-t pt-6 bg-slate-50/50">
                        <p className="text-xs text-slate-400 italic">
                            Les images envoyées sont stockées sur ImgBB.
                        </p>
                        <div className="flex gap-2">
                            {preview && !uploadedUrl && (
                                <Button 
                                    onClick={handleUpload} 
                                    disabled={uploading}
                                    className="bg-primary hover:bg-primary/90 px-8"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Héberger l'image
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
