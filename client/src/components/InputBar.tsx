import React from "react"

interface InputBarProps {
    currentMessage: string;
    setCurrentMessage: (message: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const InputBar: React.FC<InputBarProps> = ({ currentMessage, setCurrentMessage, onSubmit }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentMessage(e.target.value)
    }

    return (
        <form onSubmit={onSubmit} className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/10">
            <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/10 hover:border-teal-500/30 transition-all duration-300">
                <button
                    type="button"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-slate-700/50 transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </button>
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={currentMessage}
                    onChange={handleChange}
                    className="flex-grow px-3 py-3 bg-transparent focus:outline-none text-white placeholder-slate-500 text-sm"
                />
                <button
                    type="button"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-slate-700/50 transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                </button>
                <button
                    type="submit"
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 rounded-xl p-2.5 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 group"
                >
                    <svg className="w-5 h-5 text-white transform rotate-45 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </div>
        </form>
    )
}

export default InputBar