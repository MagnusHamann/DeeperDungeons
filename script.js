const owner = "MagnusHamann";
const repo = "DeeperDungeons";
const branch = "main";

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const topmenu = document.getElementById("topmenu");

/* ---------------------------------------------------------
   LEFT: Site title
--------------------------------------------------------- */
const siteTitle = document.createElement("a");
siteTitle.id = "site-title";
siteTitle.href = "index.html";
siteTitle.textContent = "Deeper Dungeons";
topmenu.appendChild(siteTitle);

/* ---------------------------------------------------------
   CENTER: Menu container
--------------------------------------------------------- */
const menuContainer = document.createElement("div");
menuContainer.id = "topmenu-items";

// ⭐ ADDED — ensure center menu is visible and centered
menuContainer.style.display = "flex";
menuContainer.style.flex = "1";
menuContainer.style.justifyContent = "center";
menuContainer.style.gap = "20px";

topmenu.appendChild(menuContainer);

/* ---------------------------------------------------------
   RIGHT: Buy me a coffee link
--------------------------------------------------------- */
const coffee = document.createElement("a");
coffee.id = "coffee-link";
coffee.href = "https://buymeacoffee.com/deeperdungeons";
coffee.target = "_blank";
coffee.textContent = "Buy me a coffee";
topmenu.appendChild(coffee);

/* ---------------------------------------------------------
   Fetch folder contents from GitHub
--------------------------------------------------------- */
async function fetchFolder(path) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(apiUrl);
  return await res.json();
}

/* ---------------------------------------------------------
   FILE NODE
--------------------------------------------------------- */
function buildFileNode(path, name) {
  const node = document.createElement("a");
  node.classList.add("item", "file");
  node.textContent = name;
  node.href = "#";
  node.style.cursor = "pointer";
  node.style.textDecoration = "none";
  node.style.color = "inherit";

  node.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadFile(path);
  });

  return node;
}

/* ---------------------------------------------------------
   +FOLDER NODE
--------------------------------------------------------- */
async function buildPlusFolderNode(path, name) {
  const node = document.createElement("div");
  node.classList.add("item", "folder");

  // Create a clickable link wrapper
  const link = document.createElement("a");
  link.href = "#";
  link.textContent = name;
  link.style.cursor = "pointer";
  link.style.textDecoration = "none";
  link.style.color = "inherit";
  link.style.display = "block";

  node.appendChild(link);

  const childrenContainer = document.createElement("div");
  childrenContainer.classList.add("children");
  node.appendChild(childrenContainer);

  // Function to load folder contents
  const loadFolderContents = async () => {
    if (node.classList.contains("loaded")) {
      node.classList.toggle("open");
      return;
    }

    node.classList.add("loaded");
    node.classList.add("open");

    const items = await fetchFolder(path);

    const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
    for (const folder of plusFolders) {
      const cleanName = folder.name.replace(/^\+/, "");
      const child = await buildPlusFolderNode(folder.path, cleanName);
      childrenContainer.appendChild(child);
    }

    const mdFiles = items.filter(i => i.name.endsWith(".md"));
    for (const file of mdFiles) {
      const cleanName = file.name.replace(/\.md$/, "");
      const child = buildFileNode(file.path, cleanName);
      childrenContainer.appendChild(child);
    }
  };

  link.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await loadFolderContents();
    await autoLoadFirstMarkdown(path);
  });

  node.addEventListener("click", async (e) => {
    e.stopPropagation();
  });

  return node;
}

/* ---------------------------------------------------------
   LOAD MARKDOWN FILE
--------------------------------------------------------- */
async function loadFile(path) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(rawUrl);
  const text = await res.text();
  content.innerHTML = marked.parse(text);
}

/* ---------------------------------------------------------
   TOP MENU (all _folders)
--------------------------------------------------------- */
async function buildTopMenu() {
  const rootItems = await fetchFolder("");

  if (!Array.isArray(rootItems)) {
    console.error("GitHub API returned invalid rootItems:", rootItems);
    return;
  }

  const topFolders = rootItems.filter(
    i => i.type === "dir" && i.name.startsWith("_")
  );

  if (topFolders.length === 0) {
    console.warn("No _folders found in repo root.");
  }

  for (const folder of topFolders) {
    const cleanName = folder.name.replace(/^_/, "");

    const item = document.createElement("div");
    item.classList.add("topmenu-item");
    item.style.position = "relative";

    // Clickable text
    const itemText = document.createElement("a");
    itemText.href = "#";
    itemText.textContent = cleanName;
    itemText.style.textDecoration = "none";
    itemText.style.color = "white";
    itemText.style.cursor = "pointer";

    item.appendChild(itemText);

    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");

    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.display = "none";
    dropdown.style.zIndex = "9999";

    item.addEventListener("mouseenter", () => dropdown.style.display = "block");
    item.addEventListener("mouseleave", () => dropdown.style.display = "none");

    const contents = await fetchFolder(folder.path);

    if (!Array.isArray(contents)) {
      console.error("Invalid folder contents for:", folder.path, contents);
      continue;
    }

    const plusFolders = contents.filter(
      sub => sub.type === "dir" && sub.name.startsWith("+")
    );

    for (const sub of plusFolders) {
      const subClean = sub.name.replace(/^\+/, "");

      const subItem = document.createElement("a");
      subItem.classList.add("dropdown-item");
      subItem.textContent = subClean;
      subItem.href = "#";
      subItem.style.display = "block";
      subItem.style.textDecoration = "none";
      subItem.style.color = "#333";

      subItem.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await loadSidebarForFolder(folder.name, sub.path, `${cleanName} / ${subClean}`);
        await autoLoadFirstMarkdown(sub.path);
        dropdown.style.display = "none";
      });

      dropdown.appendChild(subItem);
    }

    const mdFiles = contents.filter(sub => sub.name.endsWith(".md"));

    for (const file of mdFiles) {
      const fileClean = file.name.replace(/\.md$/, "");

      const subItem = document.createElement("a");
      subItem.classList.add("dropdown-item");
      subItem.textContent = fileClean;
      subItem.href = "#";
      subItem.style.display = "block";
      subItem.style.textDecoration = "none";
      subItem.style.color = "#333";

      subItem.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await loadFile(file.path);
        dropdown.style.display = "none";
      });

      dropdown.appendChild(subItem);
    }

    item.appendChild(dropdown);
    menuContainer.appendChild(item);
  }
}

/* ---------------------------------------------------------
   SIDEBAR FOR _folder → +folders → .md files
--------------------------------------------------------- */
async function loadSidebarForFolder(rootFolderName, path, label) {
  sidebar.innerHTML = "";

  // Header showing current section (bold, larger)
  const header = document.createElement("div");
  header.classList.add("sidebar-header");
  header.textContent = label;
  sidebar.appendChild(header);

  const items = await fetchFolder(path);

  // +folders (regular weight, same size as header)
  const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
  for (const folder of plusFolders) {
    const cleanName = folder.name.replace(/^\+/, "");
    const node = await buildPlusFolderNode(folder.path, cleanName);
    sidebar.appendChild(node);
  }

  // Markdown files (indented, smaller)
  const mdFiles = items.filter(i => i.name.endsWith(".md"));
  for (const file of mdFiles) {
    const cleanName = file.name.replace(/\.md$/, "");
    const node = buildFileNode(file.path, cleanName);
    sidebar.appendChild(node);
  }

  // ⭐ Auto-load first markdown file
  await autoLoadFirstMarkdown(path);
}

/* ---------------------------------------------------------
   AUTO LOAD FIRST MARKDOWN
--------------------------------------------------------- */
async function autoLoadFirstMarkdown(path) {
  const items = await fetchFolder(path);
  const mdFiles = items.filter(i => i.name.endsWith(".md"));

  if (mdFiles.length > 0) {
    await loadFile(mdFiles[0].path);
  }
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
async function init() {
  await buildTopMenu();
}

init();
