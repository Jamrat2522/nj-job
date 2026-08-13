export function tableShell(headHTML) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${headHTML}</tr></thead>
    <tbody></tbody></table></div><div data-pgn></div>`;
}
