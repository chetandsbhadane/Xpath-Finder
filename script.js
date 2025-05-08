function quote(val) {
    if (val.includes('"') && val.includes("'")) {
      return `"${val.replace(/"/g, '\\"')}"`;
    } else if (val.includes('"')) {
      return `'${val}'`;
    } else {
      return `"${val}"`;
    }
  }

  function generateXPathsFromElement(el) {
    if (!el || el.nodeType !== 1) return [];

    const tag = el.tagName.toLowerCase();
    const xpaths = new Set();

    const addXPath = xpath => {
      if (xpath && xpath.length < 250) xpaths.add(xpath);
    };

    const attrMap = {};
    Array.from(el.attributes).forEach(attr => {
      attrMap[attr.name] = attr.value;
    });

    // ID-based
    if (attrMap.id) addXPath(`//*[@id=${quote(attrMap.id)}]`);

    // Single attributes
    for (const [key, value] of Object.entries(attrMap)) {
      if (value) addXPath(`//${tag}[@${key}=${quote(value)}]`);
    }

    // Combined attributes
    const attributeConditions = Object.entries(attrMap)
      .filter(([_, val]) => val)
      .map(([key, val]) => `@${key}=${quote(val)}`);
    if (attributeConditions.length >= 2) {
      addXPath(`//${tag}[${attributeConditions.join(' and ')}]`);
    }

    // Text-based
    const textContent = el.textContent?.trim();
    if (textContent && textContent.length <= 80) {
      addXPath(`//${tag}[text()=${quote(textContent)}]`);
      addXPath(`//${tag}[contains(text(), ${quote(textContent)})]`);
    }

    // Tag only
    addXPath(`//${tag}`);

    return Array.from(xpaths);
  }

  function generate() {
    const html = document.getElementById("htmlInput").value.trim();
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    const el = tempContainer.firstElementChild;

    const resultBox = document.getElementById("result");
    resultBox.innerHTML = '';

    if (!el) {
      resultBox.innerHTML = '<p style="color: red;">Invalid HTML input.</p>';
      return;
    }

    const xpaths = generateXPathsFromElement(el);

    if (xpaths.length === 0) {
      resultBox.innerHTML = '<p style="color: gray;">No XPaths could be generated.</p>';
      return;
    }

    xpaths.forEach(xpath => {
      const div = document.createElement('div');
      div.className = 'xpath-item';
      const span = document.createElement('span');
      span.textContent = xpath;
      const btn = document.createElement('button');
      btn.textContent = 'Copy';
      btn.className = 'copy-btn';
      btn.onclick = () => {
        navigator.clipboard.writeText(xpath);
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      };
      div.appendChild(span);
      div.appendChild(btn);
      resultBox.appendChild(div);
    });
  }