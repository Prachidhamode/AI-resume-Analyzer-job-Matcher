const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCKS = {}; // In-memory locks for sequential writes per collection

// Helper to ensure data directory and collection files exist
async function initDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Queue system to prevent concurrent write collisions on the same collection file
function acquireLock(collection) {
  if (!LOCKS[collection]) {
    LOCKS[collection] = Promise.resolve();
  }
  let release;
  const nextLock = new Promise(resolve => {
    release = resolve;
  });
  const currentLock = LOCKS[collection];
  LOCKS[collection] = nextLock;
  return currentLock.then(() => release);
}

async function readCollection(collection) {
  await initDb();
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

async function writeCollection(collection, data) {
  await initDb();
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  const tempPath = `${filePath}.tmp`;
  
  // Write to temporary file, then rename atomically to prevent corruption
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, jsonData, 'utf8');
  await fs.rename(tempPath, filePath);
}

const db = {
  // Find multiple documents matching a query (shallow match)
  async find(collection, query = {}) {
    const items = await readCollection(collection);
    return items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Find a single document matching a query
  async findOne(collection, query = {}) {
    const items = await readCollection(collection);
    return items.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  // Insert a new document
  async create(collection, doc) {
    const release = await acquireLock(collection);
    try {
      const items = await readCollection(collection);
      const newDoc = {
        id: uuidv4(),
        ...doc,
        createdAt: new Date().toISOString()
      };
      items.push(newDoc);
      await writeCollection(collection, items);
      return newDoc;
    } finally {
      release();
    }
  },

  // Update documents matching a query
  async update(collection, query, updateObj) {
    const release = await acquireLock(collection);
    try {
      const items = await readCollection(collection);
      let updatedCount = 0;
      const updatedItems = items.map(item => {
        let match = true;
        for (const key in query) {
          if (item[key] !== query[key]) {
            match = false;
            break;
          }
        }
        if (match) {
          updatedCount++;
          return { ...item, ...updateObj, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      if (updatedCount > 0) {
        await writeCollection(collection, updatedItems);
      }
      return updatedCount;
    } finally {
      release();
    }
  },

  // Delete documents matching a query
  async delete(collection, query) {
    const release = await acquireLock(collection);
    try {
      const items = await readCollection(collection);
      const originalLength = items.length;
      const filteredItems = items.filter(item => {
        let match = true;
        for (const key in query) {
          if (item[key] !== query[key]) {
            match = false;
            break;
          }
        }
        return !match; // Keep items that don't match the query
      });
      const deletedCount = originalLength - filteredItems.length;
      if (deletedCount > 0) {
        await writeCollection(collection, filteredItems);
      }
      return deletedCount;
    } finally {
      release();
    }
  }
};

module.exports = db;
