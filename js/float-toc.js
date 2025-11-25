document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('#float-toc li.toc-item').forEach(li => {
    const childUl = li.querySelector(':scope > ol');
    if (childUl) {
        const btn = document.createElement('span');
        btn.className = 'toggle-btn';
        btn.textContent = '▶';
        btn.style.cursor = 'pointer';
        btn.style.marginRight = '5px';
        
        // 插入到 a 前面
        const link = li.querySelector('a');
        li.insertBefore(btn, link);

        // 点击按钮展开/折叠直接子节点
        btn.addEventListener('click', e => {
            e.stopPropagation(); // 阻止触发 link 的点击
            if (childUl.style.display === 'block') {
                childUl.style.display = 'none';
                btn.textContent = '▶';
            } else {
                childUl.style.display = 'block';
                btn.textContent = '▼';
            }
        });
    }
  });
  
    const tocLinks = document.querySelectorAll("#float-toc a[href^='#']");
  if (!tocLinks.length) return;

  const headings = [...document.querySelectorAll(".article-inner h1, .article-inner h2, .article-inner h3, .article-inner h4, .article-inner h5, .article-inner h6")];
  const map = new Map();

  tocLinks.forEach(link => {
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    map.set(id, link);
  });

  //console.log([...map.entries()]);

  let lastActive = null;
  
  function expandToActive(activeLink) {
    const activeLi = activeLink.closest('li.toc-item');
    if (!activeLi) return;

    // 1. 找路径到根节点
    let path = [];
    let node = activeLi;
    while (node && node.id !== 'float-toc') {
        if (node.tagName.toLowerCase() === 'li') path.push(node);
        node = node.parentElement;
    }

    // 2. 保存需要展开的 ul 集合
    const toExpand = new Set();

    // 路径节点的父 ul 和兄弟节点的直接子 ul
    path.forEach(li => {
        const parentUl = li.parentElement;
        if (parentUl) toExpand.add(parentUl);

        Array.from(parentUl.children).forEach(sibling => {
        const sibUl = sibling.querySelector(':scope > li');
        if (sibUl) toExpand.add(sibUl);
        });
    });

    // active li 的直接子 ul
    const childUl = activeLi.querySelector(':scope > ol');
    if (childUl) toExpand.add(childUl);

    // 3. 遍历所有 ul，展开需要展开的，折叠其余
    document.querySelectorAll('#float-toc ol').forEach(ul => {
        if (toExpand.has(ul)) {
            ul.style.display = 'block';
        } else {
            ul.style.display = 'none';
        }
    });

    document.querySelectorAll('#float-toc li.toc-item').forEach(li => {
        const btn = li.querySelector(':scope > .toggle-btn');
        const childUl = li.querySelector(':scope > ol');
        if (btn && childUl) {
            btn.textContent = childUl.style.display === 'block' ? '▼' : '▶';
        }
    });
  }

  function scrollTocIntoView(link) {
    const toc = document.querySelector("#float-toc");
    if (!toc) return;

    const rect = link.getBoundingClientRect();
    const tocRect = toc.getBoundingClientRect();

    // 如果 active 项已经在可视区域内则不滚动
    if (rect.top >= tocRect.top && rect.bottom <= tocRect.bottom) return;

    // 平滑滚动，使 active 项大概位于目录中间
    toc.scrollTo({
        top: link.offsetTop - toc.clientHeight / 2,
        behavior: "smooth"
    });
  }

  function spy() {
    let candidate = null;
    let scandidate = null;
    let sTop = -Infinity;
    let minTop = Infinity;

    headings.forEach(h => {
      //console.log(h.id);
      if (!h.id) return;

      const rect = h.getBoundingClientRect();

      // 只考虑在顶部 200px 之后的标题（>=200）
      if (rect.top <= 200 && rect.top > 50 && rect.top < minTop && rect.top <= window.innerHeight) {
        minTop = rect.top;
        candidate = h;
        //console.log(h.id);
      }
      if (rect.top <= 50 && rect.top > sTop) {
        sTop = rect.top;
        scandidate = h;
      }
    });

    
    if (!candidate) {
        candidate = scandidate;
    }
    // 找到了符合条件的标题
    if (candidate) {
      //console.log(candidate.id);
      const newActive = map.get(candidate.id);
      if (newActive !== lastActive) {
        tocLinks.forEach(a => a.classList.remove("active"));
        if (newActive) newActive.classList.add("active");
        lastActive = newActive;
        expandToActive(newActive);
        scrollTocIntoView(newActive);
      }
      
    }
    // 没有找到则维持 lastActive，不切换
  }

  spy(); // 初始执行
  window.addEventListener("scroll", spy, { passive: true });
});