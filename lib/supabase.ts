// server.ts - מעודכן
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    name TEXT,
    description TEXT,
    price REAL,
    stock_quantity INTEGER,
    coverage TEXT,
    drying_time TEXT,
    image_url TEXT,      -- שדה חדש
    supplier_name TEXT   -- שדה חדש
  )
`);

// דוגמה לעדכון נתונים ראשוניים
const insert = db.prepare(`
  INSERT INTO inventory (sku, name, description, price, stock_quantity, coverage, drying_time, image_url, supplier_name)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insert.run(
  "SIKA-107", 
  "סיקה טופ 107", 
  "חומר איטום צמנטי גמיש", 
  `220, 30, "4 ק"ג למ"ר", "24 שעות",`
  "https://www.sika.com/content/dam/dms/il01/k/sika_top_107_seal_new.png", 
  "גילאר (סיקה ישראל)"
);
