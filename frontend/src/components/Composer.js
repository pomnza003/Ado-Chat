import React, { useState, useRef, useEffect } from 'react';

const Composer = ({ onSendMessage, isProcessing, agentMode, setAgentMode, executionMode, setExecutionMode, enabledTools, setEnabledTools, allTools, settings }) => {
    const [prompt, setPrompt] = useState('');
    const [isConfigOpen, setConfigOpen] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const textareaRef = useRef(null);
    const configPanelRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const isModelSelected = settings && settings.model;

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
        }
    }, [prompt]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (configPanelRef.current && !configPanelRef.current.contains(event.target) && !event.target.closest('#agentConfigBtn')) {
                setConfigOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadStatus(`بارکردنی ${file.name}...`);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || 'An error occurred');
            }
            setUploadStatus(`File '${result.filename}' Successfully loaded.`);
            setPrompt(prev => `${prev} File '${result.filename}' use it `.trim());
        } catch (error) {
            setUploadStatus(`Error uploading file: ${error.message}`);
        }
    };
    
    const handleSend = () => {
        if (prompt.trim() && !isProcessing && isModelSelected) {
            onSendMessage(prompt);
            setPrompt('');
            setUploadStatus('');
        }
    };
    
    const handleToolChange = (toolId) => {
        setEnabledTools(prev => prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]);
    };
    
    return (
        <div className="composer-container p-6 border-t border-border-color bg-bg-content relative">
            {isConfigOpen && (
                 <div ref={configPanelRef} className="agent-config-panel absolute bottom-full mb-4 left-8 right-8 max-w-4xl mx-auto bg-bg-card border border-border-color rounded-xl shadow-custom-lg p-6 z-10">
                    <h3 className="text-lg font-bold mb-4">Agent & Tool Configuration</h3>
                     <div className="flex flex-col gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={agentMode} onChange={(e) => setAgentMode(e.target.checked)} className="w-5 h-5 accent-accent-primary" />
                            <span>Agent Mode</span>
                        </label>
                        {agentMode && (
                            <div className="flex flex-col gap-4 pl-8">
                                <div>
                                    <label className="font-semibold text-text-muted mb-2 block">Execution Mode</label>
                                    <div className="flex gap-4">
                                        <label><input type="radio" name="execMode" value="agent" checked={executionMode === 'agent'} onChange={(e) => setExecutionMode(e.target.value)} /> Single Agent</label>
                                        <label><input type="radio" name="execMode" value="crew" checked={executionMode === 'crew'} onChange={(e) => setExecutionMode(e.target.value)} /> Professional Agent</label>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-semibold text-text-muted mb-2 block">Available Tools</label>
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(allTools).map(([groupName, tools]) => (
                                            <div key={groupName}>
                                                <h4 className="font-bold mb-2">{groupName}</h4>
                                                {tools.map(tool => (
                                                    <label key={tool.id} className="flex items-center gap-2">
                                                        <input type="checkbox" value={tool.id} checked={enabledTools.includes(tool.id)} onChange={() => handleToolChange(tool.id)} />
                                                        {tool.label}
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        )}
                     </div>
                </div>
            )}
            {uploadStatus && <div className="text-center text-sm text-text-muted mb-2">{uploadStatus}</div>}
            <div className="composer max-w-4xl mx-auto flex gap-3 items-end bg-bg-card rounded-xl p-3 border border-border-color shadow-custom-lg focus-within:border-accent-primary focus-within:ring-4 focus-within:ring-accent-primary/20">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} disabled={!isModelSelected} />
                <button onClick={() => fileInputRef.current.click()} title="File backup" className="btn-icon p-3 rounded-md bg-bg-input hover:bg-bg-hover" disabled={!isModelSelected}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"></path></svg>
                </button>
                <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={isModelSelected ? "write your message..." : "Please select a model in Settings first..."}
                    className="flex-1 min-h-[52px] max-h-60 bg-transparent p-3 border-none resize-none focus:outline-none"
                    rows="1"
                    disabled={!isModelSelected}
                />
                <button id="agentConfigBtn" onClick={() => setConfigOpen(!isConfigOpen)} className="btn-icon p-3 rounded-md bg-bg-input hover:bg-bg-hover">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                </button>
                <button onClick={handleSend} disabled={isProcessing || !prompt.trim() || !isModelSelected} className="btn-icon bg-accent-primary text-white p-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    );
};

export default Composer;