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
   +FOLDER NODE (sidebar only)
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

    // Only +folders inside this +folder
    const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
    for (const folder of plusFolders) {
      const cleanName = folder.name.replace(/^\+/, "");
      const child = await buildPlusFolderNode(folder.path, cleanName);
      childrenContainer.appendChild(child);
    }

    // Markdown files inside this +folder
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
   TOP MENU (_folders)
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
      const cleanName = sub.name.replace(/^[+_]/, "").replace(/\.md$/, "");

      const subItem = document.createElement("div");
      subItem.classList.add("dropdown-item");
      subItem.textContent = cleanName;

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
   SIDEBAR FOR +FOLDERS AND .md FILES
--------------------------------------------------------- */
async function loadSidebarForPlusFolders(path) {
  sidebar.innerHTML = "";

  const items = await fetchFolder(path);

  // Show ONLY +folders
  const plusFolders = items.filter(i => i.type === "dir" && i.name.startsWith("+"));
  for (const folder of plusFolders) {
    const cleanName = folder.name.replace(/^\+/, "");
    const node = await buildPlusFolderNode(folder.path, cleanName);
    sidebar.appendChild(node);
  }

  // Show .md files in this _folder
  const mdFiles = items.filter(i => i.name.endsWith(".md"));
  for (const file of mdFiles) {
    const cleanName = file.name.replace(/\.md$/, "");
    const node = buildFileNode(file.path, cleanName);
    sidebar.appendChild(node);
  }
}

/* ---------------------------------------------------------
   INIT (sidebar starts empty)
--------------------------------------------------------- */
async function init() {
  sidebar.innerHTML = ""; // Sidebar only fills when clicking top menu
  await buildTopMenu();
}

init();
