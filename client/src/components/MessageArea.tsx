import React from 'react';

interface SearchInfo {
    stages: string[];
    query: string;
    urls: string[] | string;
    error?: string;
}

interface Message {
    id: number;
    content: string;
    isUser: boolean;
    type: string;
    isLoading?: boolean;
    searchInfo?: SearchInfo;
}

interface MessageAreaProps {
    messages: Message[];
}

interface SearchStagesProps {
    searchInfo?: SearchInfo;
}

const PremiumTypingAnimation = () => {
    return (
        <div className="flex items-center">
            <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"
                    style={{ animationDuration: "1s", animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                    style={{ animationDuration: "1s", animationDelay: "300ms" }}></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"
                    style={{ animationDuration: "1s", animationDelay: "600ms" }}></div>
            </div>
        </div>
    );
};

const SearchStages: React.FC<SearchStagesProps> = ({ searchInfo }) => {
    if (!searchInfo || !searchInfo.stages || searchInfo.stages.length === 0) return null;

    return (
        <div className="mb-3 mt-1 relative pl-4">
            {/* Search Process UI */}
            <div className="flex flex-col space-y-4 text-sm text-slate-300">
                {/* Searching Stage */}
                {searchInfo.stages.includes('searching') && (
                    <div className="relative">
                        {/* Teal dot with glow */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-teal-400 rounded-full z-10 shadow-lg shadow-teal-400/50"></div>

                        {/* Connecting line to next item if reading exists */}
                        {searchInfo.stages.includes('reading') && (
                            <div className="absolute -left-[7px] top-3 w-0.5 h-[calc(100%+1rem)] bg-gradient-to-b from-teal-400/60 to-cyan-400/40"></div>
                        )}

                        <div className="flex flex-col">
                            <span className="font-medium mb-2 ml-2 text-white">Searching the web</span>

                            {/* Search Query in box styling */}
                            <div className="flex flex-wrap gap-2 pl-2 mt-1">
                                <div className="bg-slate-700/50 backdrop-blur-sm text-xs px-3 py-1.5 rounded-lg border border-slate-600/50 inline-flex items-center text-slate-200">
                                    <svg className="w-3 h-3 mr-1.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    {searchInfo.query}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reading Stage */}
                {searchInfo.stages.includes('reading') && (
                    <div className="relative">
                        {/* Teal dot with glow */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-cyan-400 rounded-full z-10 shadow-lg shadow-cyan-400/50"></div>

                        <div className="flex flex-col">
                            <span className="font-medium mb-2 ml-2 text-white">Reading</span>

                            {/* Search Results */}
                            {searchInfo.urls && searchInfo.urls.length > 0 && (
                                <div className="pl-2 space-y-1">
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(searchInfo.urls) ? (
                                            searchInfo.urls.map((url, index) => (
                                                <div key={index} className="bg-slate-700/50 backdrop-blur-sm text-xs px-3 py-1.5 rounded-lg border border-slate-600/50 truncate max-w-[200px] transition-all duration-200 hover:bg-slate-600/50 text-slate-300">
                                                    {typeof url === 'string' ? url : JSON.stringify(url).substring(0, 30)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-slate-700/50 backdrop-blur-sm text-xs px-3 py-1.5 rounded-lg border border-slate-600/50 truncate max-w-[200px] transition-all duration-200 hover:bg-slate-600/50 text-slate-300">
                                                {typeof searchInfo.urls === 'string' ? searchInfo.urls.substring(0, 30) : JSON.stringify(searchInfo.urls).substring(0, 30)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Writing Stage */}
                {searchInfo.stages.includes('writing') && (
                    <div className="relative">
                        {/* Teal dot with glow effect */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-teal-400 rounded-full z-10 shadow-lg shadow-teal-400/50 animate-pulse"></div>
                        <span className="font-medium pl-2 text-white">Writing answer</span>
                    </div>
                )}

                {/* Error Message */}
                {searchInfo.stages.includes('error') && (
                    <div className="relative">
                        {/* Red dot with glow */}
                        <div className="absolute -left-3 top-1 w-2.5 h-2.5 bg-red-400 rounded-full z-10 shadow-lg shadow-red-400/50"></div>
                        <span className="font-medium text-white">Search error</span>
                        <div className="pl-4 text-xs text-red-400 mt-1">
                            {searchInfo.error || "An error occurred during search."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MessageArea: React.FC<MessageAreaProps> = ({ messages }) => {
    return (
        <div className="flex-grow overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" style={{ minHeight: 0 }}>
            <div className="max-w-4xl mx-auto p-6">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-6`}>
                        <div className="flex flex-col max-w-2xl">
                            {/* Search Status Display - Now ABOVE the message */}
                            {!message.isUser && message.searchInfo && (
                                <SearchStages searchInfo={message.searchInfo} />
                            )}

                            {/* Message Content */}
                            <div
                                className={`rounded-2xl py-3 px-5 transition-all duration-300 ${message.isUser
                                    ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-br-md shadow-lg shadow-teal-500/20'
                                    : 'bg-slate-800/50 backdrop-blur-sm text-slate-100 border border-slate-700/50 rounded-bl-md shadow-lg'
                                    }`}
                            >
                                {message.isLoading ? (
                                    <PremiumTypingAnimation />
                                ) : (
                                    message.content || (
                                        // Fallback if content is empty but not in loading state
                                        <span className="text-slate-400 text-xs italic">Waiting for response...</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessageArea;