import React, { useState, useRef, useEffect, useCallback } from 'react';
import Message from './Message';
import Composer from './Composer';

const extractSources = (steps) => {
    if (!steps) return [];
    const urls = new Set();
    const urlRegex = /https?:\/\/[^\s,"]+/g;

    Object.values(steps).forEach(step => {
        if (typeof step.input === 'string') {
            const foundInInput = step.input.match(urlRegex);
            if (foundInInput) foundInInput.forEach(url => urls.add(url));
        }
        if (typeof step.output === 'string') {
            const foundInOutput = step.output.match(urlRegex);
            if (foundInOutput) foundInOutput.forEach(url => urls.add(url));
        }
    });

    return Array.from(urls);
};

const ChatView = ({ conversation, setConversations, settings, allTools }) => {
    const [agentMode, setAgentMode] = useState(false);
    const [executionMode, setExecutionMode] = useState('agent');
    const [enabledTools, setEnabledTools] = useState(Object.values(allTools).flat().map(t => t.id));
    const [isProcessing, setIsProcessing] = useState(false);
    const abortControllerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation.messages]);

    const handleSendMessage = useCallback(async (prompt) => {
        setIsProcessing(true);
        abortControllerRef.current = new AbortController();
        const conversationId = conversation.id;

        const userMessage = { role: 'user', content: prompt, id: Date.now().toString() };
        const assistantMessageId = `asst_${Date.now()}`;
        const assistantMessage = { role: 'assistant', content: '', id: assistantMessageId, steps: {}, sources: [] };

        setConversations(prev => ({
            ...prev,
            [conversationId]: {
                ...prev[conversationId],
                messages: [...prev[conversationId].messages, userMessage, assistantMessage]
            }
        }));

        try {
            const response = await fetch('http://127.0.0.1:8000/agent-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    backend: settings.backend,
                    mode: agentMode ? executionMode : 'agent',
                    model_name: settings.model,
                    api_key: settings.apiKey,
                    enabled_tools: enabledTools
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok || !response.body) {
                throw new Error(`Server error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let finalReply = '';
            let currentSteps = {};

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const events = chunk.split('\n\n').filter(e => e.startsWith('data:'));

                for (const eventStr of events) {
                    try {
                        const jsonData = eventStr.substring(5).trim();
                        if (!jsonData) continue;
                        const event = JSON.parse(jsonData);
                        
                        if (event.event.endsWith("task_start")) {
                           currentSteps[event.data.id] = { ...event.data, status: 'running' };
                        } else if (event.event.endsWith("task_end")) {
                           currentSteps[event.data.id] = { ...currentSteps[event.data.id], status: 'completed', output: event.data.output };
                        } else if (event.event.endsWith("task_error")) {
                           currentSteps[event.data.id] = { ...currentSteps[event.data.id], status: 'error', error: event.data.error };
                        } else if (event.event === "final_answer") {
                            finalReply = event.data.reply;
                        }

                        const sources = extractSources(currentSteps);

                        setConversations(prev => {
                            const convo = prev[conversationId];
                            if (!convo) return prev;
                            const currentMessages = convo.messages;
                            const updatedAssistantMsg = { ...currentMessages[currentMessages.length - 1], content: finalReply, steps: { ...currentSteps }, sources };
                            return {
                                ...prev,
                                [conversationId]: {
                                    ...convo,
                                    messages: [...currentMessages.slice(0, -1), updatedAssistantMsg]
                                }
                            }
                        });

                    } catch (e) {
                        console.error("Stream parsing error:", e, "Chunk:", eventStr);
                    }
                }
            }

            setConversations(prev => {
                if (prev[conversationId] && prev[conversationId].title === 'New Chat') {
                    return {
                        ...prev,
                        [conversationId]: { ...prev[conversationId], title: prompt.substring(0, 30) }
                    }
                }
                return prev;
            });

        } catch (err) {
            if (err.name !== 'AbortError') {
                 const errorMessage = { role: 'assistant', content: `**Error:** ${err.message}`, id: assistantMessageId };
                 setConversations(prev => {
                    const convo = prev[conversationId];
                    if (!convo) return prev;
                    const currentMessages = convo.messages;
                    return {
                        ...prev,
                        [conversationId]: { ...convo, messages: [...currentMessages.slice(0, -2), userMessage, errorMessage] }
                    }
                 });
            }
        } finally {
            setIsProcessing(false);
        }
    }, [conversation.id, setConversations, settings, agentMode, executionMode, enabledTools]);
    
    const handleAbort = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsProcessing(false);
        }
    };
    
    return (
        <>
            <header className="chat-header p-5 border-b border-border-color flex items-center justify-between bg-bg-content">
                <div className="model-info text-base font-semibold flex items-center gap-3">
                    <span className="text-xl">🤖</span>
                    Model: <strong className="font-extrabold text-accent-primary">{settings.model || 'nothing'}</strong>
                </div>
                {isProcessing && (
                    <button onClick={handleAbort} className="btn bg-accent-danger text-white px-4 py-2 rounded-md flex items-center gap-2 font-semibold">
                        <span>Abort</span>
                    </button>
                )}
            </header>
            <div className="messages-container flex-1 overflow-y-auto p-8">
                <div className="messages-list max-w-4xl mx-auto w-full flex flex-col gap-8">
                    {conversation.messages.map((msg) => (
                        <Message key={msg.id} message={msg} modelName={settings.model || 'Assistant'}/>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <Composer
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                agentMode={agentMode}
                setAgentMode={setAgentMode}
                executionMode={executionMode}
                setExecutionMode={setExecutionMode}
                enabledTools={enabledTools}
                setEnabledTools={setEnabledTools}
                allTools={allTools}
                settings={settings}
            />
        </>
    );
};

export default ChatView;