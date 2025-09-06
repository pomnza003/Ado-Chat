import React, { useState, useEffect } from 'react';

const TOOL_ICONS = {
    web_search: '🔍',
    multi_web_search: '🌐',
    python_executor: '🐍',
    read_file: '📄',
    write_file: '📝',
    list_files: '📁',
    open_url: '🔗',
    intelligent_web_reader: '📖',
    summarize_urls: '📚',
    remember_this: '🧠',
    recall_memory: '💡',
    default: '⚙️'
};

const TOOL_DESCRIPTIONS = {
    web_search: 'Searching the web for information',
    multi_web_search: 'Performing multiple web searches',
    python_executor: 'Executing Python code',
    read_file: 'Reading file content',
    write_file: 'Writing to file',
    list_files: 'Listing directory contents',
    open_url: 'Opening URL',
    intelligent_web_reader: 'Reading web content intelligently',
    summarize_urls: 'Summarizing multiple URLs',
    remember_this: 'Storing information in memory',
    recall_memory: 'Retrieving stored information'
};

const STATUS_CLASSES = {
    running: 'border-blue-400 bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25',
    completed: 'border-green-400 bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25',
    error: 'border-red-400 bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/25',
};

const extractUrlsFromStep = (step) => {
    const urls = new Set();
    const urlRegex = /https?:\/\/[^\s,"\)\]\}]+/g;
    
    const extractFromText = (text) => {
        if (typeof text === 'string') {
            const matches = text.match(urlRegex);
            if (matches) {
                matches.forEach(url => {
                    
                    const cleanUrl = url.replace(/[.,;:!?"'\)\]\}]*$/, '');
                    if (cleanUrl.length > 10) urls.add(cleanUrl);
                });
            }
        } else if (typeof text === 'object' && text !== null) {
            Object.values(text).forEach(value => extractFromText(value));
        }
    };
    
    extractFromText(step.input);
    extractFromText(step.output);
    extractFromText(step.thought);
    
    return Array.from(urls);
};

const SearchSources = ({ steps, sources }) => {
    const [urls, setUrls] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [hoveredUrl, setHoveredUrl] = useState(null);
    
    useEffect(() => {
        const allUrls = new Set();
        
       
        if (steps) {
            Object.values(steps).forEach(step => {
                const stepUrls = extractUrlsFromStep(step);
                stepUrls.forEach(url => allUrls.add(url));
            });
        }
        
        
        if (sources && Array.isArray(sources)) {
            sources.forEach(url => {
                if (typeof url === 'string' && url.length > 10) {
                    allUrls.add(url);
                }
            });
        }
        
        const urlsArray = Array.from(allUrls).map(url => {
            let domain = '';
            let title = url;
            let favicon = '';
            try {
                const urlObj = new URL(url);
                domain = urlObj.hostname.replace('www.', '');
                title = urlObj.pathname === '/' ? domain : decodeURIComponent(urlObj.pathname.split('/').pop() || domain);
                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            } catch {
                domain = url.split('/')[2] || url;
                title = url;
                favicon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDZINmEyIDIgMCAwMC0yIDJ2MTBhMiAyIDAgMDAyIDJoMTBhMiAyIDAgMDAyLTJ2LTRNMTQgNGg2bTAgMHY2bTAtNkwxMCAxNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
            }
            
            return { url, domain, title, favicon };
        });
        
        setUrls(urlsArray);
    }, [steps, sources]);
    
    const copyToClipboard = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };
    
    const getTruncatedTitle = (title, maxLength = 45) => {
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
    };
    
    if (urls.length === 0) return null;
    
    return (
        <div className="search-sources mt-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-3xl transform rotate-1 scale-[1.02] opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-50 via-pink-50 to-orange-50 dark:from-gray-850 dark:via-gray-800 dark:to-gray-900 rounded-3xl transform -rotate-1 scale-[1.01] opacity-20"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="animate-pulse">
                            <div className="absolute top-4 left-4 w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></div>
                            <div className="absolute top-8 right-8 w-1 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                            <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
                            <div className="absolute bottom-4 right-6 w-1 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
                
                <div 
                    className="flex items-center justify-between cursor-pointer group p-6 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all duration-500"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <span className="text-white text-2xl filter drop-shadow-lg">🔗</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-xs font-bold">{urls.length}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-indigo-600 dark:from-white dark:via-purple-300 dark:to-indigo-400 bg-clip-text text-transparent group-hover:from-violet-600 group-hover:to-indigo-600 transition-all duration-300">
                                resources
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {urls.length} Resources required
                            </p>
                        </div>
                    </div>
                    <div className={`transform transition-all duration-500 ${isExpanded ? 'rotate-180 scale-110' : 'group-hover:scale-110'}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-violet-100 group-hover:to-indigo-100 dark:group-hover:from-violet-800 dark:group-hover:to-indigo-800 transition-all duration-300">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className="px-6 pb-6">
                        <div className="grid gap-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                            {urls.map((urlData, index) => (
                                <div 
                                    key={index}
                                    className="group relative bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-750 rounded-2xl border border-gray-200/60 dark:border-gray-600/40 hover:border-violet-300 dark:hover:border-violet-500 hover:shadow-xl transition-all duration-400 hover:transform hover:scale-[1.02] overflow-hidden"
                                    onMouseEnter={() => setHoveredUrl(urlData.url)}
                                    onMouseLeave={() => setHoveredUrl(null)}
                                >
                                    {/* Hover effect background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 transition-opacity duration-300 ${
                                        hoveredUrl === urlData.url ? 'opacity-100' : 'opacity-0'
                                    }`}></div>
                                    
                                    <div className="relative p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shadow-lg">
                                                        <img 
                                                            src={urlData.favicon} 
                                                            alt="Site icon" 
                                                            className="w-8 h-8 object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg hidden items-center justify-center">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                                                        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider truncate">
                                                            {urlData.domain}
                                                        </span>
                                                    </div>
                                                    <p className="text-base font-medium text-gray-800 dark:text-white leading-relaxed" title={urlData.title}>
                                                        {getTruncatedTitle(urlData.title)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(urlData.url);
                                                    }}
                                                    className="p-3 text-gray-500 hover:text-white bg-gray-100 hover:bg-gradient-to-br hover:from-violet-500 hover:to-purple-600 dark:bg-gray-700 dark:hover:from-violet-600 dark:hover:to-purple-700 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:shadow-xl"
                                                    title="Copy URL"
                                                >
                                                    {copiedUrl === urlData.url ? (
                                                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(urlData.url, '_blank', 'noopener,noreferrer');
                                                    }}
                                                    className="p-3 text-gray-500 hover:text-white bg-gray-100 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-blue-600 dark:bg-gray-700 dark:hover:from-indigo-600 dark:hover:to-blue-700 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:shadow-xl"
                                                    title="Open in new tab"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Task = ({ task, isLast, index }) => {
    const { status, thought, tool, input, output, error } = task;
    const icon = TOOL_ICONS[tool] || TOOL_ICONS.default;
    const statusClass = STATUS_CLASSES[status] || 'border-gray-500 bg-gray-500';
    const description = TOOL_DESCRIPTIONS[tool] || tool.replace(/_/g, ' ');
    const [isExpanded, setIsExpanded] = useState(status === 'running' || status === 'error');
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative pl-16 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isLast && (
                <div className="absolute left-[30px] top-20 h-full w-0.5">
                    <div className="h-full bg-gradient-to-b from-violet-400 via-purple-400 to-indigo-400 dark:from-violet-600 dark:to-indigo-600 opacity-60 animate-pulse"></div>
                    <div className="absolute inset-0 h-full w-0.5 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse [animation-delay:1s]"></div>
                </div>
            )}
            
            <div className="absolute left-0 top-4">
                <div className={`relative w-16 h-16 rounded-3xl flex items-center justify-center border-3 ${statusClass} shadow-2xl transform transition-all duration-500 ${isHovered ? 'scale-125 rotate-6' : 'group-hover:scale-110'} z-10`}>
                    {status === 'running' ? (
                        <div className="relative">
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-6 h-6 border-2 border-white/30 rounded-full animate-ping"></div>
                        </div>
                    ) : (
                        <span className="text-3xl drop-shadow-lg filter">{icon}</span>
                    )}
                </div>
                
                {/* Enhanced step number */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-600 shadow-lg z-20">
                    {index + 1}
                </div>
                
                {/* Status indicator glow */}
                <div className={`absolute inset-0 rounded-3xl blur-lg opacity-30 ${statusClass} transform scale-110 animate-pulse`}></div>
            </div>

            <div className="relative overflow-hidden ml-4">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 rounded-3xl transform rotate-1 scale-[1.01] opacity-50"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/50 via-transparent to-indigo-50/50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-3xl transform -rotate-1 scale-[1.005] opacity-60"></div>
                
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                    <div 
                        className="p-6 cursor-pointer flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-800/80 hover:from-violet-50/80 hover:via-purple-50/80 hover:to-indigo-50/80 dark:hover:from-violet-900/30 dark:hover:via-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-500 backdrop-blur-sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-5">
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-gray-800 dark:text-white capitalize mb-1">
                                    {tool.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {description}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {status === 'completed' && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-400 rounded-full text-sm font-bold border border-emerald-200 dark:border-emerald-700 shadow-lg">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Completed
                                    </div>
                                )}
                                {status === 'running' && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm font-bold border border-blue-200 dark:border-blue-700 shadow-lg">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                        Processing...
                                    </div>
                                )}
                                {status === 'error' && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-800 dark:text-red-400 rounded-full text-sm font-bold border border-red-200 dark:border-red-700 shadow-lg">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Error
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`transform transition-all duration-500 ${isExpanded ? 'rotate-180 scale-110' : 'hover:scale-110'}`}>
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center hover:bg-gradient-to-br hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-800 dark:hover:to-indigo-800 transition-all duration-300 shadow-lg">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
                        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        <div className="p-6 border-t border-gray-200/60 dark:border-gray-600/60 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-750/50 text-sm space-y-5">
                            {thought && (
                                <div className="bg-gradient-to-br from-white to-violet-50/50 dark:from-gray-800 dark:to-violet-900/20 rounded-2xl p-5 border border-violet-200/50 dark:border-violet-700/50 shadow-lg">
                                    <h4 className="text-sm font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        Thought Process
                                    </h4>
                                    <p className="font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-sm bg-white/60 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200/60 dark:border-gray-600/60">{thought}</p>
                                </div>
                            )}
                            {input && (
                                <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-5 border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
                                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                            </svg>
                                        </div>
                                        Input Parameters
                                    </h4>
                                    <pre className="p-4 bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-blue-900/30 rounded-xl text-sm whitespace-pre-wrap break-all font-mono leading-relaxed overflow-x-auto border border-gray-200/60 dark:border-gray-600/60 shadow-inner">
                                        {typeof input === 'object' ? JSON.stringify(input, null, 2) : input}
                                    </pre>
                                </div>
                            )}
                            {output && (
                                <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800 dark:to-emerald-900/20 rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg">
                                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                            </svg>
                                        </div>
                                        Output Results
                                    </h4>
                                    <pre className="p-4 bg-gradient-to-br from-gray-100 to-emerald-50 dark:from-gray-900 dark:to-emerald-900/30 rounded-xl text-sm whitespace-pre-wrap break-all font-mono leading-relaxed overflow-x-auto max-h-48 overflow-y-auto border border-gray-200/60 dark:border-gray-600/60 shadow-inner custom-scrollbar">
                                        {output}
                                    </pre>
                                </div>
                            )}
                            {error && (
                                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-700 shadow-lg">
                                    <h4 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        Error Details
                                    </h4>
                                    <pre className="p-4 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 text-red-800 dark:text-red-300 rounded-xl text-sm whitespace-pre-wrap break-all font-mono leading-relaxed border border-red-200/60 dark:border-red-600/60 shadow-inner">
                                        {error}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentWork = ({ steps, sources }) => {
    const taskValues = Object.values(steps || {});
    const isComplete = taskValues.length > 0 && taskValues.every(task => task.status === 'completed' || task.status === 'error');
    const hasRunningTasks = taskValues.some(task => task.status === 'running');
    const completedCount = taskValues.filter(task => task.status === 'completed').length;
    const errorCount = taskValues.filter(task => task.status === 'error').length;

    if (taskValues.length === 0) return null;

    return (
        <div className="agent-work-container mt-8 relative">
            {/* Background decoration using Tailwind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-400/10 via-purple-400/10 via-indigo-400/10 to-cyan-400/10 rounded-3xl animate-gradient-rotate opacity-80 -z-10"></div>
            
            {/* Floating background elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-cyan-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* Enhanced Header Section */}
            <div className="relative overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
                <div className="absolute inset-0">
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-4 left-4 w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse"></div>
                        <div className="absolute top-8 right-8 w-1 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse [animation-delay:1s]"></div>
                        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse [animation-delay:2s]"></div>
                        <div className="absolute bottom-4 right-6 w-1 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse [animation-delay:3s]"></div>
                    </div>
                </div>
                
                <div className="relative bg-gradient-to-br from-black/10 to-transparent backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {isComplete ? (
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-500">
                                            <span className="text-white text-3xl filter drop-shadow-lg">✨</span>
                                        </div>
                                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl opacity-20 blur-lg animate-pulse"></div>
                                    </div>
                                ) : hasRunningTasks ? (
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl">
                                            <div className="relative">
                                                <div className="w-8 h-8 border-4 border-white/70 border-t-transparent rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 w-8 h-8 border-3 border-white/30 rounded-full animate-ping"></div>
                                            </div>
                                        </div>
                                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl opacity-30 blur-lg animate-pulse"></div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-500">
                                            <span className="text-white text-3xl filter drop-shadow-lg">🤖</span>
                                        </div>
                                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-3xl opacity-20 blur-lg animate-pulse"></div>
                                    </div>
                                )}
                                
                                {/* Status indicator */}
                                <div className="absolute -bottom-2 -right-2">
                                    {isComplete ? (
                                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : hasRunningTasks ? (
                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-white">
                                <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                                    {isComplete ? "Mission Accomplished!" : hasRunningTasks ? "Agent Working..." : "Ready to Execute"}
                                    {hasRunningTasks && (
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                                        </div>
                                    )}
                                </h3>
                                <p className="text-white/90 text-base font-medium">
                                    {isComplete 
                                        ? `Completed ${completedCount} task${completedCount > 1 ? 's' : ''}${errorCount > 0 ? ` with ${errorCount} error${errorCount > 1 ? 's' : ''}` : ' successfully'}`
                                        : `Processing ${taskValues.length} task${taskValues.length > 1 ? 's' : ''} with advanced AI capabilities`
                                    }
                                </p>
                            </div>
                        </div>
                        
                        {/* Enhanced Progress Indicator */}
                        <div className="text-right">
                            <div className="mb-3">
                                <div className="text-white/95 text-lg font-bold mb-1">
                                    {completedCount + errorCount} / {taskValues.length}
                                </div>
                                <div className="text-white/80 text-sm">
                                    {Math.round(((completedCount + errorCount) / taskValues.length) * 100)}% Complete
                                </div>
                            </div>
                            <div className="relative">
                                <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                                    <div 
                                        className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                        style={{ width: `${((completedCount + errorCount) / taskValues.length) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between text-xs text-white/70">
                                    <span>Start</span>
                                    <span>Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tasks List */}
            <div className="task-list space-y-8 mb-8 mt-8">
                {taskValues.map((step, index) => (
                    <Task key={step.id} task={step} isLast={index === taskValues.length - 1} index={index} />
                ))}
            </div>
            
            {/* Search Sources Section */}
            <SearchSources steps={steps} sources={sources} />
            
            {/* Enhanced Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #8b5cf6, #3b82f6);
                    border-radius: 4px;
                    transition: background 0.3s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #7c3aed, #2563eb);
                }
                
                /* Enhanced animations */
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default AgentWork;