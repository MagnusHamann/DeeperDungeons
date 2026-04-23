const owner = "MagnusHamann";
const repo = "DeeperDungeons";
const branch = "main";

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const topmenu = document.getElementById("topmenu");

// Fetch folder contents from GitHub API
async function fetchFolder(path) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(apiUrl);
  return await res.json();
}

/* ---------------------------------------------------------
   FILE NODE (subheader)
--------------------------------------------------------- */
function buildFileNode(path, name) {
  const node = document.createElement("div");
  node.classList.add("item", "file");
  node.textContent = name; // FIXED: removed accidental "+ name"

  node.addEventListener("click", (e) => {
    e.stopPropagation();
    loadFile(path);
  });

  return node;
}

/* ---------------------------------------------------------
   FOLDER NODE (sidebar-style)
--------------------------------------------------------- */
async function buildFolderNode(path, name) {
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

    // Subfolders
    for (const item of items.filter(i => i.type === "dir")) {
      const child = await buildFolderNode(item.path, item.name.replace(/^[+_]/, ""));
      childrenContainer.appendChild(child);
    }

    // Markdown files
    for (const item of items.filter(i => i.name.endsWith(".md"))) {
      const child = buildFileNode(item.path, item.name.replace(/\.md$/, ""));
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
   TOP MENU (folders starting with "_")
--------------------------------------------------------- */
async function buildTopMenu() {
  const rootItems = await fetchFolder("");

  const topFolders = rootItems.filter(
    i => i.type === "dir" && i.name.startsWith("_")
  );

  for (const folder of topFolders) {
    const item = document.createElement("div");
    item.classList.add("topmenu-item");
    item.textContent = folder.name.replace(/^_/, "");

    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");

    const contents = await fetchFolder(folder.path);

    for (const sub of contents) {
      const subItem = document.createElement("div");
      subItem.classList.add("dropdown-item");
      subItem.textContent = sub.name.replace(/\.md$/, "").replace(/^[+_]/, "");

      subItem.addEventListener("click", (e) => {
        e.stopPropagation();

        if (sub.type === "dir") {
          loadSidebarForPlusFolders(sub.path);
        } else {
          loadFile(sub.path);
        }
      });

      dropdown.appendChild(subItem);
    }

    item.appendChild(dropdown);
    topmenu.appendChild(item);
  }
}

/* ---------------------------------------------------------
   SIDEBAR FOR +FOLDERS (section navigation)
--------------------------------------------------------- */
async function loadSidebarForPlusFolders(path) {
  sidebar.innerHTML = "";

  const items = await fetchFolder(path);

  const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
  const mdFiles = items.filter(i => i.name.endsWith(".md"));

  // +folders become headers
  for (const folder of plusFolders) {
    const node = await buildFolderNode(folder.path, folder.name.replace(/^\+/, ""));
    sidebar.appendChild(node);
  }

  // Markdown files become subheaders
  for (const file of mdFiles) {
    const node = buildFileNode(file.path, file.name.replace(/\.md$/, ""));
    sidebar.appendChild(node);
  }
}

/* ---------------------------------------------------------
   DEFAULT SIDEBAR (normal folders)
--------------------------------------------------------- */
async function initSidebar() {
  const rootItems = await fetchFolder("");

  // Normal folders (not _ or +)
  for (const item of rootItems.filter(i =>
    i.type === "dir" && !i.name.startsWith("_") && !i.name.startsWith("+")
  )) {
    const folderNode = await buildFolderNode(item.path, item.name);
    sidebar.appendChild(folderNode);
  }

  // Markdown files in root
  for (const item of rootItems.filter(i => i.name.endsWith(".md"))) {
    const fileNode = buildFileNode(item.path, item.name.replace(/\.md$/, ""));
    sidebar.appendChild(fileNode);
  }
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
async function init() {
  await initSidebar();
  await buildTopMenu();
}

init();
