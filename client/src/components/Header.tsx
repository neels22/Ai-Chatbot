const Header = () => {
    return (
        <header className="relative flex items-center justify-between px-8 py-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-lg border-b border-white/10 z-10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <span className="text-white text-sm font-bold">P</span>
                </div>
                <span className="font-semibold text-white text-lg tracking-wide">Perplexity 2.0</span>
            </div>

            <div className="flex items-center">
                <button className="text-white bg-gradient-to-r from-teal-500 to-cyan-500 text-sm px-6 py-2 font-medium rounded-full hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 cursor-pointer">
                    Chat
                </button>
            </div>
        </header>
    )
}

export default Header