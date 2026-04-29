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

  // You can replace this with a JSON file or auto‑generation
  const menu = {
    ranger: ["stalker", "hunter", "beast-master"],
    wizard: ["evoker", "illusionist"]
  };

  sidebar.innerHTML = menu[section]
    .map(item => `<a href="page.html?path=${section}/${item}">${item.replace("-", " ")}</a>`)
    .join("<br>");
}

loadContent();
