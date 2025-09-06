import React, { useState, useEffect, useCallback } from 'react';

const SettingsModal = ({ isOpen, onClose, currentSettings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(currentSettings);
    const [models, setModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLocalSettings(currentSettings);
    }, [isOpen, currentSettings]);

    const fetchOllamaModels = async () => {
        try {
            const res = await fetch('http://localhost:11434/api/tags');
            if (!res.ok) throw new Error('Ollama وەڵام ناداتەوە.');
            const data = await res.json();
            return (data.models || []).map(m => m.name).sort();
        } catch (e) {
            throw new Error('Contacting Ollama was unsuccessful.');
        }
    };

    const fetchAIStudioModels = async (apiKey) => {
        if (!apiKey) throw new Error('API key پێویستە.');
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(endpoint);
        if (!res.ok) {
            let msg = 'The adoption of the models was unsuccessful.';
            try { const j = await res.json(); if (j?.error?.message) msg = j.error.message; } catch { }
            throw new Error(msg);
        }
        const data = await res.json();
        return (data.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent")).map(m => m.name?.replace(/^models\//, '') || '').sort();
    };

    const fetchNvidiaModels = async (apiKey) => {
        if (!apiKey) throw new Error('API key is required for NVIDIA.');
        return ["openai/gpt-oss-120b"];
    };

    const populateModels = useCallback(async () => {
        if (!localSettings.backend) return;
        setIsLoadingModels(true);
        setError('');
        setModels([]);
        try {
            let modelList = [];
            const apiKey = localSettings.apiKey;
            switch (localSettings.backend) {
                case 'ollama':
                    modelList = await fetchOllamaModels();
                    break;
                case 'aistudio':
                    modelList = await fetchAIStudioModels(apiKey);
                    break;
                case 'nvidia':
                    modelList = await fetchNvidiaModels(apiKey);
                    break;
                default:
                    throw new Error("Unsupported backend selected.");
            }
            setModels(modelList);
            if (modelList.length > 0 && !modelList.includes(localSettings.model)) {
                setLocalSettings(prev => ({ ...prev, model: modelList[0] }));
            } else if (modelList.length === 0) {
                 setLocalSettings(prev => ({ ...prev, model: null }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingModels(false);
        }
    }, [localSettings.backend, localSettings.apiKey, localSettings.model]);

   
    useEffect(() => {
        if (isOpen) {
            populateModels();
        }
    }, [isOpen, populateModels]); 

    const handleSave = () => {
        onSave(localSettings);
    };

    if (!isOpen) return null;

    const showApiKey = localSettings.backend === 'aistudio' || localSettings.backend === 'nvidia';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-bg-card text-text-main rounded-xl shadow-lg w-full max-w-2xl border border-border-color">
                <div className="modal-header p-6 border-b border-border-color flex justify-between items-center">
                    <h2 className="text-2xl font-bold">General settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-hover">&times;</button>
                </div>
                <div className="modal-body p-8 flex flex-col gap-6">
                    {error && <div className="p-3 bg-red-900/50 text-red-300 rounded-md border border-red-700">{error}</div>}
                    <div className="form-group flex flex-col gap-2">
                        <label htmlFor="backendSelect" className="font-semibold">Backend</label>
                        <select
                            id="backendSelect"
                            value={localSettings.backend}
                            onChange={(e) => setLocalSettings({ ...localSettings, backend: e.target.value, model: null, apiKey: e.target.value === 'ollama' ? '' : localSettings.apiKey })}
                            className="p-3 bg-bg-input border border-border-color rounded-md focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/50"
                        >
                            <option value="ollama">Ollama (local)</option>
                            <option value="aistudio">Google AI Studio</option>
                            <option value="nvidia">NVIDIA AI Foundation</option>
                        </select>
                    </div>

                    {showApiKey && (
                        <div className="form-group flex flex-col gap-2">
                            <label htmlFor="apiKeyInput" className="font-semibold">API Key</label>
                            <input
                                id="apiKeyInput"
                                type="password"
                                value={localSettings.apiKey}
                                onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                                className="p-3 bg-bg-input border border-border-color rounded-md focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/50"
                                placeholder="API key ..."
                            />
                        </div>
                    )}

                    <div className="form-group flex flex-col gap-2">
                        <label htmlFor="modelSelect" className="font-semibold">Model</label>
                        <select
                            id="modelSelect"
                            value={localSettings.model || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                            className="p-3 bg-bg-input border border-border-color rounded-md focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/50"
                            disabled={isLoadingModels || models.length === 0}
                        >
                            {isLoadingModels && <option>Loading models...</option>}
                            {!isLoadingModels && error && <option>Error loading models</option>}
                            {!isLoadingModels && !error && models.length === 0 && <option>No models were found</option>}
                            {models.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="modal-footer p-6 border-t border-border-color flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-bg-hover border border-border-color font-semibold">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md bg-accent-primary text-white font-semibold">Save</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;