const owner = "MagnusHamann";
const repo = "DeeperDungeons";
const branch = "main";

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const topmenu = document.getElementById("topmenu");

// Add site title (left-ish, but within centered bar)
const siteTitle = document.createElement("a");
siteTitle.id = "site-title";
siteTitle.href = "index.html";
siteTitle.textContent = "Deeper Dungeons";
topmenu.appendChild(siteTitle);

// Container for menu items (center)
const menuContainer = document.createElement("div");
menuContainer.id = "topmenu-items";
topmenu.appendChild(menuContainer);

// Fetch folder contents from GitHub API
async function fetchFolder(path) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(apiUrl);
  return await res.json();
}

/* ---------------------------------------------------------
   FILE NODE
--------------------------------------------------------- */
function buildFileNode(path, name) {
  const node = document.createElement("div");
  node.classList.add("item", "file");
  node.textContent = name;

  node.addEventListener("click", (e) => {
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
  node.textContent = name;

  const childrenContainer = document.createElement("div");
  childrenContainer.classList.add("children");
  node.appendChild(childrenContainer);

  node.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (node.classList.contains("loaded")) {
      node.classList.toggle("open");
      return;
    }

    node.classList.add("loaded");
    node.classList.add("open");

    const items = await fetchFolder(path);

    // Only +folders
    const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
    for (const folder of plusFolders) {
      const cleanName = folder.name.replace(/^\+/, "");
      const child = await buildPlusFolderNode(folder.path, cleanName);
      childrenContainer.appendChild(child);
    }

    // Markdown files
    const mdFiles = items.filter(i => i.name.endsWith(".md"));
    for (const file of mdFiles) {
      const cleanName = file.name.replace(/\.md$/, "");
      const child = buildFileNode(file.path, cleanName);
      childrenContainer.appendChild(child);
    }
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
   TOP MENU (_Classes only)
--------------------------------------------------------- */
async function buildTopMenu() {
  const rootItems = await fetchFolder("");

  // Only the _Classes folder becomes a top menu item
  const classesFolder = rootItems.find(
    i => i.type === "dir" && i.name === "_Classes"
  );

  if (!classesFolder) return;

  const item = document.createElement("div");
  item.classList.add("topmenu-item");
  item.textContent = "Classes";

  const dropdown = document.createElement("div");
  dropdown.classList.add("dropdown");

  const contents = await fetchFolder(classesFolder.path);

  // Only +folders inside _Classes
  const plusFolders = contents.filter(
    sub => sub.type === "dir" && sub.name.startsWith("+")
  );

  for (const sub of plusFolders) {
    const cleanName = sub.name.replace(/^\+/, "");

    const subItem = document.createElement("div");
    subItem.classList.add("dropdown-item");
    subItem.textContent = cleanName;

    subItem.addEventListener("click", (e) => {
      e.stopPropagation();
      // Sidebar shows which section we're in
      loadSidebarForPlusFolders(sub.path, `Classes / ${cleanName}`);
    });

    dropdown.appendChild(subItem);
  }

  item.appendChild(dropdown);
  menuContainer.appendChild(item);
}

/* ---------------------------------------------------------
   SIDEBAR FOR +FOLDERS AND .md FILES
   label = "Classes / Arcanist" etc.
--------------------------------------------------------- */
async function loadSidebarForPlusFolders(path, label) {
  sidebar.innerHTML = "";

  // Header showing current section
  if (label) {
    const header = document.createElement("div");
    header.classList.add("folder");
    header.textContent = label;
    sidebar.appendChild(header);
  }

  const items = await fetchFolder(path);

  // +folders
  const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
  for (const folder of plusFolders) {
    const cleanName = folder.name.replace(/^\+/, "");
    const node = await buildPlusFolderNode(folder.path, cleanName);
    sidebar.appendChild(node);
  }

  // Markdown files
  const mdFiles = items.filter(i => i.name.endsWith(".md"));
  for (const file of mdFiles) {
    const cleanName = file.name.replace(/\.md$/, "");
    const node = buildFileNode(file.path, cleanName);
    sidebar.appendChild(node);
  }
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
async function init() {
  await buildTopMenu();
}

init();
