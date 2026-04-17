function getChecklist() {
  return JSON.parse(localStorage.getItem("checklist") || "{}");
}

function toggleVisited(id) {
  const data = getChecklist();
  data[id] = data[id] === "visited" ? null : "visited";
  localStorage.setItem("checklist", JSON.stringify(data));
}
