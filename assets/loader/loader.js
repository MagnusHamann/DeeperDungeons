async function loadContent() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get("path") || "ranger/stalker";

  // Load markdown
  const mdFile = `/content/${path}.md`;
  const response = await fetch(mdFile);
  const text = await response.text();

  document.getElementById("content").innerHTML = marked.parse(text);

  // Load sidebar
  loadSidebar(path.split("/")[0]);
}

async function loadSidebar(section) {
  const sidebar = document.getElementById("sidebar");

  // Load the folder index.md
  const indexFile = `/content/${section}/index.md`;
  const response = await fetch(indexFile);
  const text = await response.text();

  // Extract file names from markdown list
  const files = [...text.matchAll(/- (.+\.md)/g)].map(m => m[1]);

  // Build sidebar links
  sidebar.innerHTML = files
    .map(file => {
      const name = file.replace(".md", "").replace("-", " ");
      return `<a href="page.html?path=${section}/${file.replace(".md", "")}">${name}</a>`;
    })
    .join("<br>");
}

