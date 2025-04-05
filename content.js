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
        '<div id="toc-header">Conversation TOC</div><ul id="toc-list"></ul>';
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
        var tocList = document.getElementById("toc-list");
        if (!tocList) return;
        tocList.innerHTML = "";
        var turns = (container || document).querySelectorAll(
            "article[data-testid^='conversation-turn-']"
        );
        if (!turns || turns.length === 0) {
            tocList.innerHTML =
                '<li style="opacity:0.7;font-style:italic;">Empty chat</li>';
            return;
        }
        for (var i = 0; i < turns.length; i++) {
            var turn = turns[i];
            var li = document.createElement("li");
            var header = turn.querySelector("h6.sr-only");
            var isAI = false;
            if (header && header.textContent.indexOf("ChatGPT said:") >= 0) {
                isAI = true;
                li.textContent = "Turn " + (i + 1) + " (AI)";
            } else {
                li.textContent = "Turn " + (i + 1) + " (You)";
            }
            (function (element) {
                li.addEventListener("click", function () {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                });
            })(turn);
            if (isAI) {
                var sublist = document.createElement("ul");
                var sections = turn.querySelectorAll("h3:not(.sr-only)");
                for (var j = 0; j < sections.length; j++) {
                    var section = sections[j];
                    var skip = false;
                    var node = section;
                    while (node) {
                        if (node.tagName === "PRE" || node.tagName === "CODE") {
                            skip = true;
                            break;
                        }
                        node = node.parentElement;
                    }
                    if (skip) continue;
                    var subLi = document.createElement("li");
                    var title =
                        (section.textContent || "").trim() ||
                        "Section " + (j + 1);
                    subLi.textContent = title;
                    (function (sec) {
                        subLi.addEventListener("click", function (event) {
                            event.stopPropagation();
                            sec.classList.remove("toc-highlight");
                            sec.offsetWidth;
                            sec.classList.add("toc-highlight");
                            sec.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                            });
                        });
                    })(section);
                    sublist.appendChild(subLi);
                }
                if (sublist.children.length > 0) {
                    li.appendChild(sublist);
                }
            }
            tocList.appendChild(li);
        }
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
