import React from 'react'

const StudyPage = () => {
    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <aside className="w-72 md:w-80 border-r border-border flex flex-col shrink-0 bg-white"> {/* 왼쪽 사이드바*/}
                <div className="p-6 border-b border-border">
                    <div className="relative">
                        <input type="text" placeholder='검색......'
                            className="w-full h-12 pl-12 bg-muted/5 border border-border rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50">🔍</span>
                    </div>
                </div>

                {/* 메뉴 영역 */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-10">
                    <div className="text-sm font-black text-foreground/40 uppercase tracking-widest mb-5 px-2">
                        <h3>언어선택</h3>
                    </div>
                    <div className="space-y-1">
                        <button >JavaScrip</button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-black text-foreground/40 uppercase tracking-widest mb-5 px-2">챕터</h3>
                    <div>
                        <button>
                            <span>챕터 제목 영역</span>
                            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">기초문법 ❯</span>
                        </button>
                    </div>
                </div>
            </aside>
           
            <main className="flex-1 overflow-y-auto scrollbar-hide bg-white">
                <div className="max-w-4xl mx-auto px-8 py-12 md:px-16 md:py-20">
                    <nav className="flex items-center gap-3 mb-12">
                        <span className="px-3 py-1.5 bg-foreground text-white text-xs font-black rounded-md tracking-tighter">언어 태크</span>
                        <span className="text-lg font-black text-foreground">선택 챕터타이틀</span>

                    </nav>
                    <article className="space-y-16">
                        <header className="space-y-6">
                            <h1>챕터타이틀</h1>
                            <div>챕터내용</div>
                        </header>


                        <section className="space-y-10">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="space-y-6 pb-16 border-b border-border last:border-0">
                                    <div className="h-8 w-48 bg-foreground/10 rounded-lg"></div> {/* 소제목 */}
                                    <div className="space-y-4">
                                        <div className="h-5 w-full bg-foreground/5 rounded"></div>
                                        <div className="h-5 w-11/12 bg-foreground/5 rounded"></div>
                                        <div className="h-5 w-10/12 bg-foreground/5 rounded"></div>
                                    </div>
                                    {/* 코드 블록 또는 이미지 Placeholder */}
                                    <div className="h-64 w-full bg-foreground/[0.02] border-2 border-dashed border-border rounded-3xl flex items-center justify-center">
                                        <span className="text-foreground/20 font-black italic text-xl">Content Section {n}</span>
                                    </div>
                                </div>
                            ))}

                            {/* 하단 여백: 무한 스크롤이 트리거되는 지점 */}
                            <div className="h-40 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        </section>


                    </article>
                </div>
            </main>


        </div>


    )
}

export default StudyPage