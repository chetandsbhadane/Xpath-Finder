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

  function generateSeleniumLocators(el) {
    const tag = el.tagName.toLowerCase();
    const attr = {};
    Array.from(el.attributes).forEach(a => attr[a.name] = a.value);

    const locators = {};

    if (attr.id) locators["By ID"] = `By.id('${attr.id}')`;
    if (attr.name) locators["By Name"] = `By.name('${attr.name}')`;
    if (attr.id) locators["By CSS"] = `By.cssSelector('${tag}#${attr.id}')`;
    if (attr.class) {
      const classes = attr.class.trim().split(/\s+/).join('.');
      locators["By CSS (class)"] = `By.cssSelector('${tag}.${classes}')`;
    }

    const bestXPath = generateXPathsFromElement(el)[0];
    if (bestXPath) locators["By XPath"] = `By.xpath("${bestXPath}")`;

    return locators;
  }

  function createResultItem(text) {
    const div = document.createElement('div');
    div.className = 'xpath-item';

    const span = document.createElement('span');
    span.className = 'xpath-text';
    span.textContent = text;

    const btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.className = 'copy-btn';
    btn.onclick = () => {
      navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    };

    div.appendChild(span);
    div.appendChild(btn);
    return div;
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
    const locators = generateSeleniumLocators(el);

    if (xpaths.length === 0 && Object.keys(locators).length === 0) {
      resultBox.innerHTML = '<p style="color: gray;">No locators could be generated.</p>';
      return;
    }

    if (xpaths.length > 0) {
      const heading = document.createElement('h4');
      heading.textContent = 'XPath Suggestions';
      resultBox.appendChild(heading);

      xpaths.forEach(xpath => {
        resultBox.appendChild(createResultItem(xpath));
      });
    }

    if (Object.keys(locators).length > 0) {
      const heading = document.createElement('h4');
      heading.textContent = 'Selenium Locator Suggestions';
      resultBox.appendChild(heading);

      Object.entries(locators).forEach(([label, code]) => {
        resultBox.appendChild(createResultItem(`${label}: ${code}`));
      });
    }
  }
