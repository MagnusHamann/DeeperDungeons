
const owner = "MagnusHamann";
const repo = "DeeperDungeons";
const branch = "main";   // change to "master" if your repo uses that

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");

// Fetch folder contents from GitHub API
async function fetchFolder(path) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(apiUrl);
  return await res.json();
}

// Build a folder node
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

    // Folders first
    for (const item of items.filter(i => i.type === "dir")) {
      const child = await buildFolderNode(item.path, item.name);
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

// Build a file node
function buildFileNode(path, name) {
  const node = document.createElement("div");
  node.classList.add("item", "file");
  node.textContent = + name;

  node.addEventListener("click", (e) => {
    e.stopPropagation();
    loadFile(path);
  });

  return node;
}

// Load markdown file into content area
async function loadFile(path) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(rawUrl);
  const text = await res.text();

  content.innerHTML = marked.parse(text);
}

// Initialize sidebar at repo root
async function init() {
  const rootItems = await fetchFolder("");

  // Folders
  for (const item of rootItems.filter(i => i.type === "dir")) {
    const folderNode = await buildFolderNode(item.path, item.name);
    sidebar.appendChild(folderNode);
  }

  // Markdown files in root
  for (const item of rootItems.filter(i => i.name.endsWith(".md"))) {
    const fileNode = buildFileNode(item.path, item.name.replace(/\.md$/, ""));
    sidebar.appendChild(fileNode);
  }
}

init();
