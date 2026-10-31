/* ingredients.md is the only inventory source. Recipes are the .md files listed in MD_FILES (index.html). No remote services or build step. */
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const norm = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[‘’]/g, "'").replace(/&/g, 'and');
const key = (name) => norm(name).trim();

/* Other words recipes use for an inventory item. Each item's own name always matches, singular or plural. Keys are item names, lowercase. */
const ALIASES = {
  'beef chuck': ['chuck'],
  'beef mince': ['minced beef'],
  'beef rump': ['rump'],
  'beef shank': ['gravy beef'],
  'pork belly': ['confit rare breed pork belly'],
  'gammon joint': ['gammon'],
  'pancetta': ['guanciale'],
  'cooked roast lamb': ['roast lamb'],
  'white fish fillets': ['white fish'],
  'tinned tuna': ['tuna'],
  'milk': ['full-cream milk'],
  'sour cream': ['soured cream'],
  'yoghurt': ['yogurt'],
  'parmesan': ['parmigiano reggiano'],
  'gruyere': ['hard cheese'],
  'tasty cheese': ['cheddar'],
  'tofu puffs': ['deep-fried tofu'],
  'onions': ['onion'],
  'spring onions': ['green onions', 'scallions'],
  'garlic': ['garlic cloves', 'cloves garlic', 'garlic clove', 'clove garlic', 'garlic, cloves'],
  'fresh red chillies': ['red chilli', "bird's eye chilli", 'birds eye chilli', 'chilli pepper', 'fresh red chilli pepper'],
  'tomatoes': ['tomato'],
  'broccoli': ['broccoli florets', 'broccoli stems'],
  'green cabbage': ['cabbage', 'savoy cabbage'],
  'bok choy': ['chinese broccoli'],
  'green capsicum': ['green pepper'],
  'salad leaves': ['salad'],
  'flat-leaf parsley': ['parsley', 'flat leaf parsley'],
  'fresh coriander': ['coriander', 'cilantro', 'coriander root'],
  'laksa leaves': ['hot mint'],
  'frozen peas': ['peas'],
  'thick chips': ['chips'],
  'plain flour': ['flour', 'all-purpose flour'],
  '00 flour': ['00-tipo flour'],
  'cornflour': ['cornstarch'],
  'dried yeast': ['yeast'],
  'bicarb soda': ['bicarbonate of soda', 'baking soda'],
  'caster sugar': ['sugar', 'white sugar', 'granulated sugar'],
  'brown sugar': ['muscovado sugar', 'jaggery'],
  'vanilla pods': ['vanilla pod'],
  'panko breadcrumbs': ['panko'],
  'dried pasta': ['pasta', 'spaghetti', 'rigatoni', 'pappardelle', 'fettuccine', 'farfalle', 'tagliatelle', 'macaroni', 'penne'],
  'ramen noodles': ['ramen', 'alkaline noodles'],
  'rice noodles': ['vermicelli'],
  'puy lentils': ['lentils'],
  'chickpea miso': ['fermented chickpeas'],
  'cashews': ['cashew nuts'],
  'macadamias': ['macadamia nuts'],
  'mixed peel': ['candied orange peel', 'candied peel'],
  'black pepper': ['pepper', 'peppercorns', 'black peppercorns'],
  'chilli flakes': ['crushed red pepper', 'dried chilli flakes'],
  'dried red chillies': ['dried chilli', 'dried chillies'],
  'dried mexican chillies': ['chipotle', 'ancho', 'pasilla', 'mulatto', 'arbol', 'hot chilli', 'fruity chilli'],
  'ground cumin': ['cumin powder'],
  'ground turmeric': ['turmeric'],
  'paprika': ['sweet paprika'],
  'cinnamon sticks': ['cinnamon stick', 'cinnamon quill'],
  'cardamom pods': ['cardamom', 'green cardamom pods'],
  'five-spice powder': ['five-spice', 'five spice'],
  'saffron': ['saffron threads'],
  'bay leaves': ['bay leaf'],
  'dried oregano': ['oregano'],
  'olive oil': ['extra virgin olive oil'],
  'neutral oil': ['oil', 'vegetable oil', 'canola', 'sunflower', 'groundnut oil'],
  'garlic-infused olive oil': ['garlic infused olive oil'],
  'basil olive oil': ['olive and basil oil'],
  'white vinegar': ['malt vinegar'],
  'sriracha': ['chilli sauce'],
  'chilli oil': ['chili oil', 'la jiao you'],
  'doubanjiang': ['chilli bean paste'],
  'tamarind': ['tamarind water', 'tamarind puree'],
  'english mustard': ['hot english mustard'],
  'worcestershire sauce': ['worcestershire', 'worcestershiresauce'],
  'tahini': ['tahini paste'],
  'basil and olive oil spread': ['basilic'],
  'coleslaw dressing': ['coleslaw dressing, omit the celery seed'],
  'tinned tomatoes': ['tin tomatoes', 'tinned cherry tomatoes', 'tin plum tomatoes'],
  'cream of mushroom soup': ['condensed cream of mushroom soup'],
  'dried porcini': ['dried porcini mushrooms'],
  'chicken stock': ['chicken broth'],
  'dry white wine': ['white wine'],
  'shaoxing wine': ['shaoxing rice wine', 'shaoxing'],
  'sweet sherry': ['pedro ximenez'],
  'whiskey': ['whisky'],
  'dry ginger ale': ['ginger ale'],
  'ginger preserve': ['chunky ginger preserve'],
  'muslin or cheesecloth': ['muslin', 'cheesecloth'],
};
const FREE = ['water', 'ice']; // Assumed available; never listed in ingredients.md.
const CATEGORIES = {
  Bread: ['bread', 'dough', 'barmbrack', 'tangzhong', 'gougere', 'pizza'],
  Soup: ['soup', 'laksa', 'chilli', 'colcannon', 'noodle'],
  Pasta: ['pasta', 'spaghetti', 'carbonara', 'bolognese', 'boscaiola'],
  Meat: ['steak', 'beef', 'pork', 'ham', 'chicken', 'duck', 'meat pie', 'scotch egg', 'souvlaki', 'adobo', 'carnitas', 'lamb', 'braise'],
  Fish: ['fish', 'prawn', 'seafood', 'tuna'],
  Curry: ['curry', 'massaman', 'korma', 'laksa', 'vindaloo'],
  Baking: ['cake', 'pudding', 'barmbrack', 'candied', 'gougere'],
}; // Matched against recipe names only.

function parseInventory(markdown) {
  const items = new Map();
  let category = 'Other';
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) category = heading[1].trim();
    const bullet = line.match(/^\s*[-*+]\s+(.+?)\s*$/);
    if (!bullet) continue;
    const out = /\[x\]/i.test(bullet[1]);
    const name = bullet[1].replace(/\[[ x]\]/ig, '').trim();
    if (!name) continue;
    const id = key(name);
    if (items.has(id)) items.get(id).out ||= out;
    else items.set(id, {id, name, category, out});
  }
  return [...items.values()];
}

/* Longest terms match first and blank out what they match, so "olive oil" is never also read as "oil". */
let matchers = [];
function buildMatchers() {
  const terms = inventory.flatMap(item => [item.id, ...(ALIASES[item.id] || [])].map(term => ({term: norm(term), item})));
  for (const term of FREE) terms.push({term, item: null});
  matchers = terms.sort((a, b) => b.term.length - a.term.length).map(({term, item}) => {
    const stem = term.endsWith('ss') ? term : term.replace(/(es|s)$/, '');
    return {item, pattern: new RegExp(`(^|[^a-z0-9])${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(e|es|s)?(?![a-z0-9])`, 'g')};
  });
}
/* Parentheses are notes, except "(or …)", which offers an alternative. A line containing "or" needs any one of its items; otherwise it needs all of them. */
function analyseLine(text) {
  const optional = /\b(optional|recommended)\b/i.test(text) || (/\b(to|for) (serve|serving|topping|dusting|kneading)\b/i.test(text) && !/\bplus (extra|more)\b/i.test(text));
  let rest = ` ${norm(text)} `;
  while (/\((?!or\b)[^()]*\)/.test(rest)) rest = rest.replace(/\((?!or\b)[^()]*\)/g, ' ');
  const either = /\bor\b/.test(rest);
  const items = [];
  let free = false;
  for (const {item, pattern} of matchers) {
    rest = rest.replace(pattern, (match, before) => {
      if (!item) free = true;
      else if (!items.includes(item)) items.push(item);
      return before + ' '.repeat(match.length - before.length);
    });
  }
  return {type: 'item', text, optional, either, free, items};
}
const lineMissing = (line) => {
  const out = line.items.filter(item => item.out);
  if (!line.either) return out;
  return line.free || out.length < line.items.length ? [] : out.slice(0, 1);
};
const missing = (recipe) => [...new Set(recipe.lines.filter(line => line.type === 'item' && !line.optional).flatMap(lineMissing))];
const stockMessage = (recipe) => { const count = missing(recipe).length; return count ? `${count} ingredient${count === 1 ? '' : 's'} missing` : 'Everything in stock'; };

function parseRecipe(markdown, slug) {
  const [, front = '', body = markdown] = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) || [];
  const meta = {};
  for (const line of front.split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at === -1) continue;
    const raw = line.slice(at + 1).trim();
    try { meta[line.slice(0, at).trim()] = raw ? JSON.parse(raw) : null; } catch { meta[line.slice(0, at).trim()] = raw; }
  }
  const sections = {};
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) { current = heading[1].trim().toLowerCase(); sections[current] = []; }
    else if (current && line.trim()) sections[current].push(line.trim());
  }
  const list = (name) => (sections[name] || []).map(line => line.replace(/^([-*+]|\d+\.)\s+/, ''));
  const lines = list('ingredients').map(line => {
    const bold = line.match(/^\*\*(.+)\*\*$/);
    if (bold || /:$/.test(line) || /^for the\b/i.test(line) || /^[^a-z]*[A-Z]{3}[^a-z]*$/.test(line)) return {type: 'header', text: (bold ? bold[1] : line).replace(/:$/, '')};
    return analyseLine(line);
  });
  const name = String(meta.recipe_name || slug).replace(/[\s–—-]+$/, '');
  return {
    slug, name, lines,
    image: meta.image || `images/${slug}.jpg`,
    servings: meta.servings, prep: meta.prep_time, cook: meta.cook_time,
    author: meta.author, url: meta.source_url,
    categories: Object.keys(CATEGORIES).filter(category => CATEGORIES[category].some(word => norm(name).includes(word))),
    description: (sections.description || []).join(' '),
    directions: list('directions'), notes: list('notes'), storage: (sections.storage || []).join(' '),
  };
}

let inventory = [], recipes = [], purchased = {};
try { purchased = JSON.parse(localStorage.getItem('kitchen-purchased') || '{}') || {}; } catch { /* Storage may be disabled. */ }
const timing = (recipe) => [recipe.servings, recipe.prep && `Prep ${recipe.prep}`, recipe.cook && `Cook ${recipe.cook}`].filter(Boolean).join(' · ');
const plate = '<div class="card-art" aria-hidden="true"><div class="mini-plate"></div></div>';

function renderRecipes() {
  const query = $('#search').value.trim().toLowerCase();
  const filter = $('#availability').value;
  const category = $('#category').value;
  const visible = recipes.filter(recipe => {
    const count = missing(recipe).length;
    return (filter === 'all' || (filter === 'ready' && !count) || (filter === 'one' && count === 1) || (filter === 'few' && count <= 3)) && (category === 'all' || recipe.categories.includes(category)) && `${recipe.name} ${recipe.lines.map(line => line.text).join(' ')}`.toLowerCase().includes(query);
  }).sort((a,b) => missing(a).length - missing(b).length || a.name.localeCompare(b.name));
  $('#results').textContent = `${visible.length} RECIPE${visible.length === 1 ? '' : 'S'}`;
  $('#cards').innerHTML = visible.length ? visible.map(recipe => {
    const need = missing(recipe);
    return `<article class="card"><div class="card-art" aria-hidden="true"><img src="${escapeHTML(recipe.image)}" alt="" loading="lazy"></div><div class="card-body"><span class="tag">${escapeHTML(recipe.categories.join(' · ') || 'Kitchen')}</span><h3>${escapeHTML(recipe.name)}</h3><span class="badge ${need.length ? '' : 'ready'}">${stockMessage(recipe)}</span>${timing(recipe) ? `<p>${escapeHTML(timing(recipe))}</p>` : ''}<p class="ingredients">${need.length ? `Need: ${need.slice(0, 6).map(item => escapeHTML(item.name)).join(' · ')}${need.length > 6 ? ` · +${need.length - 6} more` : ''}` : 'Ready to cook.'}</p><button class="recipe-button" data-recipe="${recipes.indexOf(recipe)}" aria-label="View ${escapeHTML(recipe.name)} recipe">View recipe <span aria-hidden="true">↗</span></button></div></article>`;
  }).join('') : '<p>No recipes match. Try another search or filter.</p>';
}
function openRecipe(index) {
  const recipe = recipes[index];
  if (!recipe) return;
  const ingredient = (line) => {
    if (line.type === 'header') return `<li class="subhead">${escapeHTML(line.text)}</li>`;
    const need = lineMissing(line);
    const note = line.optional ? ' <small>— optional</small>' : need.length ? ` <small>— need ${need.map(item => escapeHTML(item.name)).join(', ')}</small>` : '';
    return `<li class="${need.length && !line.optional ? 'missing' : ''}">${escapeHTML(line.text)}${note}</li>`;
  };
  const source = recipe.url ? `<a href="${escapeHTML(recipe.url)}" target="_blank" rel="noopener noreferrer">Original recipe${recipe.author ? ` at ${escapeHTML(recipe.author)}` : ''} ↗</a>` : escapeHTML(recipe.author || '');
  $('#recipe-detail').innerHTML = `<img class="detail-image" src="${escapeHTML(recipe.image)}" alt=""><p class="eyebrow">${escapeHTML(timing(recipe) || 'THE RECIPE')}</p><h2 id="recipe-title">${escapeHTML(recipe.name)}</h2><p class="badge">${stockMessage(recipe)}</p>${recipe.description ? `<p>${escapeHTML(recipe.description)}</p>` : ''}<div class="detail-grid"><div><h3>Ingredients</h3><ul>${recipe.lines.map(ingredient).join('')}</ul></div><div>${recipe.directions.length ? `<h3>Method</h3><ol>${recipe.directions.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol>` : ''}${recipe.notes.length ? `<h3>Notes</h3><ul>${recipe.notes.map(note => `<li>${escapeHTML(note)}</li>`).join('')}</ul>` : ''}${recipe.storage ? `<h3>Storage</h3><p>${escapeHTML(recipe.storage)}</p>` : ''}</div></div><p class="hint">Water and ice are assumed. Optional and serving extras are not included in the stock check.</p>${source ? `<p>${source}</p>` : ''}`;
  $('#recipe-dialog').showModal();
  $('#recipe-dialog').scrollTop = 0;
}
function renderInventory() {
  const categories = [...new Set(inventory.map(item => item.category))];
  $('#inventory').innerHTML = categories.map(category => `<section class="stock-group"><h3>${escapeHTML(category)}</h3>${inventory.filter(i => i.category === category).map(item => `<div class="stock-row"><span>${escapeHTML(item.name)}</span><span class="stock-label ${item.out ? 'out' : ''}">${item.out ? 'Out of stock' : 'In stock'}</span></div>`).join('')}</section>`).join('');
  const out = inventory.filter(item => item.out);
  $('#shop-count').textContent = out.length;
  $('#shopping-items').innerHTML = out.length ? [...new Set(out.map(item => item.category))].map(category => `<h3 class="shopping-group">${escapeHTML(category)}</h3>${out.filter(item => item.category === category).map(item => `<label class="shopping-row"><input type="checkbox" data-item="${escapeHTML(item.id)}" ${purchased[item.id] ? 'checked' : ''}><span>${escapeHTML(item.name)}</span></label>`).join('')}`).join('') : '<p>Your kitchen is fully stocked.</p>';
  $('#stats').innerHTML = `<span><strong>${inventory.filter(i => !i.out).length}</strong> in stock</span><span><strong>${recipes.filter(r => !missing(r).length).length}</strong> ready to cook*</span><span><strong>${out.length}</strong> to restock</span>`;
  $('#stats').title = 'Ready to cook checks required ingredients; optional and serving extras are separate.';
}
for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => {
    for (const tab of document.querySelectorAll('[data-tab]')) {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', active);
      document.getElementById(tab.dataset.tab).hidden = !active;
    }
  });
}
$('#search').addEventListener('input', renderRecipes);
$('#availability').addEventListener('change', renderRecipes);
$('#category').addEventListener('change', renderRecipes);
$('#cards').addEventListener('click', event => { const button = event.target.closest('[data-recipe]'); if (button) openRecipe(Number(button.dataset.recipe)); });
document.addEventListener('error', event => { if (event.target.matches?.('.card-art img')) event.target.closest('.card-art').outerHTML = plate; else if (event.target.matches?.('.detail-image')) event.target.remove(); }, true);
$('#close-dialog').addEventListener('click', () => $('#recipe-dialog').close());
$('#recipe-dialog').addEventListener('click', event => { if (event.target === $('#recipe-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
$('#shopping-items').addEventListener('change', event => {
  if (!event.target.matches('[data-item]')) return;
  purchased[event.target.dataset.item] = event.target.checked;
  try { localStorage.setItem('kitchen-purchased', JSON.stringify(purchased)); } catch { $('#shopping-status').textContent = 'Shopping ticks cannot be saved in this browser.'; }
});
$('#download').addEventListener('click', () => {
  const out = inventory.filter(item => item.out);
  const list = [...new Set(out.map(item => item.category))].map(category => `${category}\n${out.filter(item => item.category === category).map(item => `- [${purchased[item.id] ? 'x' : ' '}] ${item.name}`).join('\n')}`).join('\n\n');
  const url = URL.createObjectURL(new Blob([`Kitchen — shopping list\n\n${list || 'Nothing to restock.'}\n\nFrom ingredients.md. Shopping ticks do not update kitchen stock.\n`], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'kitchen-shopping-list.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
async function init() {
  try {
    const response = await fetch('ingredients.md', {cache:'no-store'});
    if (!response.ok) throw new Error('Unable to load ingredients.md.');
    inventory = parseInventory(await response.text());
    if (!inventory.length) throw new Error('No ingredients found in ingredients.md.');
    buildMatchers();
    const texts = await Promise.all(MD_FILES.map(slug => fetch(`${slug}.md`).then(r => r.ok ? r.text() : null).catch(() => null)));
    recipes = texts.map((text, i) => text && parseRecipe(text, MD_FILES[i])).filter(Boolean);
    if (!recipes.length) throw new Error('No recipes could be loaded.');
    $('#category').innerHTML = `<option value="all">All dishes</option>${Object.keys(CATEGORIES).map(category => `<option>${category}</option>`).join('')}`;
    renderInventory(); renderRecipes();
  } catch (error) {
    $('#stats').textContent = 'The pantry could not be loaded.';
    $('#error').hidden = false;
    $('#error').textContent = `${error.message} Serve this folder through GitHub Pages or a local web server, then reload.`;
    $('#download').disabled = true;
  }
}
init();
