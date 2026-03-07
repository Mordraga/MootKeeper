// categoryStore.js

const CATEGORIES_KEY = "streamCategories";

const DEFAULT_CATEGORIES = {
  relationships: ["Friend", "Artist", "Viewer", "Mod", "Moot", "Oshi", "Senpai", "Kohai", "Other"],
  tags: {
    Interests: ["Gaming", "IRL", "Art", "Music", "Tech"],
    Misc: ["Collab-Open", "Collab-Selective", "Lurker-Friendly", "Interactive", "Chill", "Chaotic", "Cozy", "Feral", "Unhinged", "NSFW", "NSFW-Lite", "Consistent", "Sporadic"],
    Personality: ["Seiso", "Ojou", "Genki", "Kuudere", "Tsundere", "Kamidere", "Yandere", "Dandere", "Deredere"],
    Language: ["EN", "JP", "DE", "FR", "RU"],
    Size: ["Micro", "Small", "Mid", "Large", "Partnered"],
    Affiliations: ["Hololive", "Nijisanji", "VShojo", "Independent"]
  }
};

export function loadCategories() {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    const data = saved ? JSON.parse(saved) : { ...DEFAULT_CATEGORIES };

    if (Array.isArray(data.tags)) {
      data.tags = { Other: data.tags };
    } else if (!data.tags || typeof data.tags !== "object") {
      data.tags = { ...DEFAULT_CATEGORIES.tags };
    }

    if (!Array.isArray(data.relationships)) {
      data.relationships = [...DEFAULT_CATEGORIES.relationships];
    }

    return data;
  } catch {
    return { ...DEFAULT_CATEGORIES };
  }
}

export function saveCategories(data) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
}

export function addRelationship(name) {
  const cats = loadCategories();
  const trimmed = name.trim();
  if (!trimmed || cats.relationships.includes(trimmed)) return false;
  cats.relationships.push(trimmed);
  saveCategories(cats);
  return true;
}

export function removeRelationship(name) {
  const cats = loadCategories();
  cats.relationships = cats.relationships.filter(r => r !== name);
  saveCategories(cats);
}

export function addTag(name, group) {
  const cats = loadCategories();
  const trimmed = name.trim();
  const allTags = Object.values(cats.tags).flat();
  if (!trimmed || allTags.includes(trimmed)) return false;
  if (!cats.tags[group]) cats.tags[group] = [];
  cats.tags[group].push(trimmed);
  saveCategories(cats);
  return true;
}

export function removeTag(name) {
  const cats = loadCategories();
  for (const group of Object.keys(cats.tags)) {
    if (Array.isArray(cats.tags[group])) {
      cats.tags[group] = cats.tags[group].filter(t => t !== name);
    }
  }
  saveCategories(cats);
}
