(function () {
    "use strict";
    if (
        document.getElementById("toc-panel") ||
        document.getElementById("toc-handle")
    )
        return;
    var styleEl = document.createElement("style");
    styleEl.textContent =
        '#toc-panel{position:fixed;top:0;right:0;width:280px;height:100%;background:#fafafa;box-shadow:-4px 0 8px rgba(0,0,0,.1);font-family:sans-serif;font-size:.8rem;border-left:1px solid #ddd;display:flex;flex-direction:column;z-index:9998;transform:translateX(0);transition:transform .3s ease}#toc-panel.collapsed{transform:translateX(280px)}#toc-header{padding:6px 10px;background:#ddd;border-bottom:1px solid #ccc;font-weight:bold;flex-shrink:0}#toc-list{list-style:none;flex:1;overflow-y:auto;margin:0;padding:6px}#toc-list li{padding:4px;cursor:pointer;border-radius:3px;transition:background-color .2s}#toc-list li:hover{background:#f0f0f0}#toc-list ul{margin-left:16px;padding:0}#toc-list ul li::before{content:""}#toc-handle{position:fixed;top:50%;right:0;transform:translateY(-50%);width:30px;height:80px;background:#ccc;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;text-orientation:mixed;cursor:pointer;font-weight:bold;user-select:none;z-index:9999;transition:background .2s}#toc-handle:hover{background:#bbb}@keyframes highlightFade{0%{background-color:#fffa99}100%{background-color:transparent}}.toc-highlight{animation:highlightFade 1.5s forwards}@media (prefers-color-scheme:dark){#toc-panel{background:#333;border-left:1px solid #555;box-shadow:-4px 0 8px rgba(0,0,0,.7)}#toc-header{background:#555;border-bottom:1px solid #666;color:#eee}#toc-list li:hover{background:#444}#toc-list{color:#eee}#toc-handle{background:#555;color:#ddd}#toc-handle:hover{background:#666}}';
    document.head.appendChild(styleEl);

    var tocPanel = document.createElement("div");
    tocPanel.id = "toc-panel";
    tocPanel.innerHTML =
        '<div id="toc-header">ChatGPT Table of Contents</div><ul id="toc-list"></ul>';
    document.body.appendChild(tocPanel);

    var tocHandle = document.createElement("div");
    tocHandle.id = "toc-handle";
    tocHandle.textContent = "TOC";
    document.body.appendChild(tocHandle);

    var container = null,
        observer = null,
        debounceLock = false,
        debounceTimeout = null;

    function debounceUpdate() {
        if (debounceLock) return;
        debounceLock = true;
        debounceTimeout = setTimeout(function () {
            updateTOC();
            debounceLock = false;
        }, 300);
    }

    function updateTOC() {
        const tocList = document.getElementById("toc-list");
        if (!tocList) return;
    
        tocList.innerHTML = "";
        const turns = (container || document).querySelectorAll(
            "article[data-testid^='conversation-turn-']"
        );
    
        if (!turns.length) {
            tocList.innerHTML =
                '<li style="opacity:0.7;font-style:italic;">Empty chat</li>';
            return;
        }
    
        turns.forEach((turn, idx) => {
            const li = document.createElement("li");
    
            const isAI =
                turn.querySelector("h6.sr-only")?.textContent.includes("ChatGPT said:");

                const previewNode = turn.querySelector(
                "p:not(.sr-only):not(:has(code)), \
                 div:not(.sr-only):not(:has(code)),  \
                 span:not(.sr-only):not(:has(code))"
            );
    
            let contentPreview = previewNode?.textContent.trim() || "";
            if (!contentPreview) contentPreview = isAI ? "AI's Turn" : "Your Turn";
    
            const maxLength = 100;
            if (contentPreview.length > maxLength) {
                contentPreview = contentPreview.slice(0, maxLength - 3) + "...";
            }
    
            li.textContent = `Turn ${idx + 1} ${isAI ? "(AI)" : "(You)"}: ${contentPreview}`;
    
            li.addEventListener("click", () =>
                turn.scrollIntoView({ behavior: "smooth", block: "start" })
            );
    
            if (isAI) {
                const sublist = document.createElement("ul");
                turn.querySelectorAll("h3:not(.sr-only)").forEach((sec, j) => {
                    // Bỏ qua các tiêu đề nằm trong code block
                    if (sec.closest("pre, code")) return;
    
                    const subLi = document.createElement("li");
                    const title = (sec.textContent || "").trim() || `Section ${j + 1}`;
                    subLi.textContent = title;
                    subLi.addEventListener("click", (e) => {
                        e.stopPropagation();
                        sec.classList.remove("toc-highlight");
                        void sec.offsetWidth; 
                        sec.classList.add("toc-highlight");
                        sec.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                    sublist.appendChild(subLi);
                });
                if (sublist.children.length) li.appendChild(sublist);
            }
    
            tocList.appendChild(li);
        });
    }
    

    function initObserver() {
        var mainContainer =
            document.querySelector("main#main") ||
            document.querySelector(".chat-container") ||
            null;
        if (mainContainer !== container) {
            container = mainContainer;
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            if (container) {
                observer = new MutationObserver(function () {
                    debounceUpdate();
                });
                observer.observe(container, { childList: true, subtree: true });
                updateTOC();
            }
        }
    }

    initObserver();
    setInterval(initObserver, 2000);
    tocPanel.classList.toggle("collapsed");
    tocHandle.addEventListener("click", function () {
        tocPanel.classList.toggle("collapsed");
    });
})();
