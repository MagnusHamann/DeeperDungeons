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
   TOP MENU (all _folders, with auto-load)
--------------------------------------------------------- */
async function buildTopMenu() {
  const rootItems = await fetchFolder("");

  // All folders starting with "_"
  const topFolders = rootItems.filter(
    i => i.type === "dir" && i.name.startsWith("_")
  );

  for (const folder of topFolders) {
    const cleanName = folder.name.replace(/^_/, "");

    // Create top-level menu item
    const item = document.createElement("div");
    item.classList.add("topmenu-item");
    item.textContent = cleanName;

    // Dropdown container
    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");

    // Fetch contents of this _folder
    const contents = await fetchFolder(folder.path);

    /* ---------------------------------------------------------
       +FOLDERS inside this _folder
    --------------------------------------------------------- */
    const plusFolders = contents.filter(
      sub => sub.type === "dir" && sub.name.startsWith("+")
    );

    for (const sub of plusFolders) {
      const subClean = sub.name.replace(/^\+/, "");

      const subItem = document.createElement("div");
      subItem.classList.add("dropdown-item");
      subItem.textContent = subClean;

      subItem.addEventListener("click", async (e) => {
        e.stopPropagation();

        // Load sidebar
        await loadSidebarForFolder(folder.name, sub.path, `${cleanName} / ${subClean}`);

        // ⭐ Auto-load first markdown file inside this +folder
        await autoLoadFirstMarkdown(sub.path);
      });

      dropdown.appendChild(subItem);
    }

    /* ---------------------------------------------------------
       .MD FILES inside this _folder
    --------------------------------------------------------- */
    const mdFiles = contents.filter(sub => sub.name.endsWith(".md"));

    for (const file of mdFiles) {
      const fileClean = file.name.replace(/\.md$/, "");

      const subItem = document.createElement("div");
      subItem.classList.add("dropdown-item");
      subItem.textContent = fileClean;

      subItem.addEventListener("click", async (e) => {
        e.stopPropagation();
        await loadFile(file.path);
      });

      dropdown.appendChild(subItem);
    }

    // Attach dropdown to menu item
    item.appendChild(dropdown);

    // Add to center menu container
    menuContainer.appendChild(item);
  }
}


/* ---------------------------------------------------------
   SIDEBAR FOR _folder → +folders → .md files
--------------------------------------------------------- */
async function loadSidebarForFolder(rootFolderName, path, label) {
  sidebar.innerHTML = "";

  // Header showing current section
  const header = document.createElement("div");
  header.classList.add("folder");
  header.textContent = label;
  sidebar.appendChild(header);

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

  // ⭐ Auto-load first markdown file
  await autoLoadFirstMarkdown(path);
}


/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
async function autoLoadFirstMarkdown(path) {
  const items = await fetchFolder(path);
  const mdFiles = items.filter(i => i.name.endsWith(".md"));

  if (mdFiles.length > 0) {
    await loadFile(mdFiles[0].path);
  }
}


init();
