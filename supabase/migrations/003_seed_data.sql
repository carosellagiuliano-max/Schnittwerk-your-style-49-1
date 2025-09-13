-- Seed data for initial database population
-- Migrating existing mock data from /src/data/products.ts

-- Insert product categories
INSERT INTO categories (id, name, description, slug, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Gutscheine & Geschenkboxen', 'Geschenkgutscheine und spezielle Geschenkboxen', 'gutscheine-geschenkboxen', 1, true),
  (gen_random_uuid(), 'Trinity Haircare Shampoo', 'Hochwertige Shampoos für verschiedene Haartypen', 'trinity-shampoo', 2, true),
  (gen_random_uuid(), 'Trinity Haircare Conditioner', 'Pflegende Conditioner für gesundes Haar', 'trinity-conditioner', 3, true),
  (gen_random_uuid(), 'Trinity Haircare Styling', 'Styling-Produkte für den perfekten Look', 'trinity-styling', 4, true),
  (gen_random_uuid(), 'TAILOR''s Herrenpflege', 'Professionelle Herrenpflegeprodukte', 'tailors-herrenpflege', 5, true),
  (gen_random_uuid(), 'Accessoires', 'Hochwertige Accessoires für Haar und Styling', 'accessoires', 6, true);

-- Insert services
INSERT INTO services (id, name, description, duration_minutes, price, requires_gender) VALUES
  (gen_random_uuid(), 'Damenschnitt', 'Professioneller Haarschnitt für Damen', 60, 75.00, 'female'),
  (gen_random_uuid(), 'Herrenschnitt', 'Klassischer Herrenhaarschnitt', 45, 45.00, 'male'),
  (gen_random_uuid(), 'Kinderschnitt', 'Haarschnitt für Kinder bis 12 Jahre', 30, 25.00, 'child'),
  (gen_random_uuid(), 'Coloration', 'Professionelle Haarfärbung', 120, 120.00, null),
  (gen_random_uuid(), 'Strähnchen', 'Highlights und Lowlights', 90, 95.00, null),
  (gen_random_uuid(), 'Waschen & Föhnen', 'Haarwäsche und Styling', 45, 35.00, null),
  (gen_random_uuid(), 'Bartpflege', 'Professionelle Bartpflege und -schnitt', 30, 30.00, 'male'),
  (gen_random_uuid(), 'Hochzeitsstyling', 'Styling für besondere Anlässe', 90, 150.00, null);

-- Get category IDs for product insertion
DO $$
DECLARE
  cat_gutscheine UUID;
  cat_shampoo UUID;
  cat_conditioner UUID;
  cat_styling UUID;
  cat_tailors UUID;
  cat_accessoires UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_gutscheine FROM categories WHERE slug = 'gutscheine-geschenkboxen';
  SELECT id INTO cat_shampoo FROM categories WHERE slug = 'trinity-shampoo';
  SELECT id INTO cat_conditioner FROM categories WHERE slug = 'trinity-conditioner';
  SELECT id INTO cat_styling FROM categories WHERE slug = 'trinity-styling';
  SELECT id INTO cat_tailors FROM categories WHERE slug = 'tailors-herrenpflege';
  SELECT id INTO cat_accessoires FROM categories WHERE slug = 'accessoires';

  -- Insert voucher products
  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, image_url, sort_order, is_active)
    VALUES (gen_random_uuid(), cat_gutscheine, 'Gutschein Frauen CHF 20', 'Geschenkgutschein für Damen im Wert von CHF 20', 'Perfekt für kleinere Behandlungen oder als Ergänzung zu einem größeren Geschenk. Einlösbar für alle Dienstleistungen und Produkte.', 'Gutschein bei der Buchung oder im Salon einlösen. Gültig 12 Monate ab Ausstellungsdatum.', 20.00, 'VOUCHER-F-20', false, 0, '/assets/voucher-women.jpg', 1, true);

  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, image_url, sort_order, is_active)
    VALUES (gen_random_uuid(), cat_gutscheine, 'Gutschein Frauen CHF 50', 'Geschenkgutschein für Damen im Wert von CHF 50', 'Ideal für eine komplette Behandlung oder mehrere kleinere Services. Perfektes Geschenk für jeden Anlass.', 'Gutschein bei der Buchung oder im Salon einlösen. Gültig 12 Monate ab Ausstellungsdatum.', 50.00, 'VOUCHER-F-50', false, 0, '/assets/voucher-women.jpg', 2, true);

  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, image_url, sort_order, is_active)
    VALUES (gen_random_uuid(), cat_gutscheine, 'Gutschein Frauen CHF 100', 'Geschenkgutschein für Damen im Wert von CHF 100', 'Für umfassende Behandlungen wie Schnitt, Farbe und Styling. Das perfekte Verwöhngeschenk.', 'Gutschein bei der Buchung oder im Salon einlösen. Gültig 12 Monate ab Ausstellungsdatum.', 100.00, 'VOUCHER-F-100', false, 0, '/assets/voucher-women.jpg', 3, true);

  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, image_url, sort_order, is_active)
    VALUES (gen_random_uuid(), cat_gutscheine, 'Gutschein Männer CHF 20', 'Geschenkgutschein für Herren im Wert von CHF 20', 'Perfekt für kleinere Behandlungen oder als Ergänzung zu einem größeren Geschenk.', 'Gutschein bei der Buchung oder im Salon einlösen. Gültig 12 Monate ab Ausstellungsdatum.', 20.00, 'VOUCHER-M-20', false, 0, '/assets/voucher-men.jpg', 4, true);

  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, image_url, sort_order, is_active)
    VALUES (gen_random_uuid(), cat_gutscheine, 'Gutschein Männer CHF 50', 'Geschenkgutschein für Herren im Wert von CHF 50', 'Ideal für eine komplette Herrenpflege inklusive Schnitt und Bartpflege.', 'Gutschein bei der Buchung oder im Salon einlösen. Gültig 12 Monate ab Ausstellungsdatum.', 50.00, 'VOUCHER-M-50', false, 0, '/assets/voucher-men.jpg', 5, true);

  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, image_url, sort_order, is_active)
    VALUES (gen_random_uuid(), cat_gutscheine, 'Gutschein Männer CHF 100', 'Geschenkgutschein für Herren im Wert von CHF 100', 'Für umfassende Herrenpflege und Styling. Perfekt für besondere Anlässe.', 'Gutschein bei der Buchung oder im Salon einlösen. Gültig 12 Monate ab Ausstellungsdatum.', 100.00, 'VOUCHER-M-100', false, 0, '/assets/voucher-men.jpg', 6, true);
  -- Insert Trinity Haircare Shampoos
  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, low_stock_threshold, image_url, sort_order, is_active) VALUES
    (gen_random_uuid(), cat_shampoo, 'Hydrating Shampoo', 'Feuchtigkeitsspendendes Shampoo für trockenes Haar', 'Unser Hydrating Shampoo wurde speziell für trockenes und strapaziertes Haar entwickelt. Mit natürlichen Ölen und Proteinen spendet es intensive Feuchtigkeit und stärkt die Haarstruktur. Das Haar wird geschmeidig, glänzend und gesund aussehend.', 'Auf das nasse Haar auftragen, sanft einmassieren und gründlich ausspülen. Bei Bedarf wiederholen. Für beste Ergebnisse mit dem passenden Conditioner verwenden.', 24.90, 'TRI-SHAMP-HYD', true, 15, 3, '/assets/products/hydrating-shampoo.jpg', 1, true),
    (gen_random_uuid(), cat_shampoo, 'Volume Shampoo', 'Volumen-Shampoo für feines Haar', 'Das Volume Shampoo verleiht feinem und kraftlosem Haar sofort spürbares Volumen und Fülle. Die leichte Formel beschwert das Haar nicht und sorgt für lang anhaltende Sprungkraft und Bewegung.', 'Auf das nasse Haar auftragen, sanft einmassieren und gründlich ausspülen. Kopfüber föhnen für maximales Volumen.', 26.50, 'TRI-SHAMP-VOL', true, 12, 3, '/assets/products/volume-shampoo.jpg', 2, true),
    (gen_random_uuid(), cat_shampoo, 'Color Protect Shampoo', 'Farbschutz-Shampoo für coloriertes Haar', 'Speziell für coloriertes Haar entwickelt, schützt dieses Shampoo die Farbintensität und verlängert die Haltbarkeit Ihrer Haarfarbe. UV-Filter schützen vor dem Ausbleichen durch Sonneneinstrahlung.', 'Auf das nasse Haar auftragen, sanft einmassieren und gründlich ausspülen. Verwenden Sie kühles Wasser für optimalen Farbschutz.', 28.90, 'TRI-SHAMP-COL', true, 18, 4, '/assets/products/color-protect-shampoo.jpg', 3, true);

  -- Insert Trinity Haircare Conditioners
  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, low_stock_threshold, image_url, sort_order, is_active) VALUES
    (gen_random_uuid(), cat_conditioner, 'Repair Conditioner', 'Regenerierender Conditioner für geschädigtes Haar', 'Unser intensiv pflegender Repair Conditioner repariert und stärkt geschädigtes Haar von innen heraus. Mit Keratin und natürlichen Proteinen werden Haarbruch reduziert und die Elastizität verbessert.', 'Nach der Haarwäsche auf das handtuchtrockene Haar auftragen, 2-3 Minuten einwirken lassen und gründlich ausspülen.', 27.50, 'TRI-COND-REP', true, 14, 3, '/assets/products/repair-conditioner.jpg', 1, true),
    (gen_random_uuid(), cat_conditioner, 'Moisturizing Conditioner', 'Feuchtigkeitsspendender Conditioner', 'Dieser luxuriöse Conditioner spendet intensiv Feuchtigkeit und macht das Haar seidig weich und kämmbar. Ideal für alle Haartypen, die zusätzliche Pflege benötigen.', 'Nach der Haarwäsche gleichmäßig im Haar verteilen, kurz einwirken lassen und ausspülen.', 25.90, 'TRI-COND-MOIST', true, 16, 4, '/assets/products/moisturizing-conditioner.jpg', 2, true);

  -- Insert Trinity Haircare Styling
  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, low_stock_threshold, image_url, sort_order, is_active) VALUES
    (gen_random_uuid(), cat_styling, 'Heat Protection Spray', 'Hitzeschutz-Spray für Styling-Tools', 'Schützt das Haar vor Hitzeschäden durch Föhn, Glätteisen und Lockenstab bis zu 230°C. Das leichte Spray entwirrt zusätzlich und erleichtert das Styling.', 'Auf das handtuchtrockene Haar sprühen und gleichmäßig verteilen. Vor dem Styling mit heißen Tools anwenden.', 19.90, 'TRI-HEAT-PROT', true, 20, 5, '/assets/products/heat-protection-spray.jpg', 1, true),
    (gen_random_uuid(), cat_styling, 'Texturizing Spray', 'Textur-Spray für Definition und Griff', 'Verleiht dem Haar natürliche Textur und Definition. Perfekt für Beach Waves und lässige Styles. Sorgt für Griff ohne zu beschweren.', 'Auf das trockene oder handtuchtrockene Haar sprühen und mit den Fingern einkneten für natürliche Textur.', 22.50, 'TRI-TEXT-SPRAY', true, 18, 4, '/assets/products/texturizing-spray.jpg', 2, true),
    (gen_random_uuid(), cat_styling, 'Nourishing Hair Oil', 'Pflegendes Haaröl für Glanz und Geschmeidigkeit', 'Ein luxuriöses Haaröl mit kostbaren Pflanzenölen, das dem Haar intensiven Glanz verleiht und Frizz reduziert. Kann als Finish oder als intensive Pflegekur verwendet werden.', 'Wenige Tropfen in den Handflächen verreiben und in die Spitzen einarbeiten. Für intensive Pflege als Kur vor der Haarwäsche verwenden.', 32.90, 'TRI-HAIR-OIL', true, 12, 3, '/assets/products/hair-oil.jpg', 3, true);

  -- Insert TAILOR's Herrenpflege
  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, low_stock_threshold, image_url, sort_order, is_active) VALUES
    (gen_random_uuid(), cat_tailors, 'TAILOR''s Clay', 'Matte Clay für starken Halt', 'Professionelle Styling-Clay für matten Look mit starkem Halt. Ideal für moderne Herrenfrisuren und strukturierte Styles. Wasserlöslich und ohne Rückstände.', 'Eine kleine Menge zwischen den Handflächen erwärmen und gleichmäßig im trockenen Haar verteilen. Nach Belieben stylen.', 28.50, 'TAIL-CLAY', true, 25, 5, '/lovable-uploads/42070e4c-5169-49b9-9c0b-f49470a8a11f.png', 1, true),
    (gen_random_uuid(), cat_tailors, 'TAILOR''s Cream', 'Styling Cream für natürlichen Glanz', 'Vielseitige Styling-Creme mit mittlerem Halt und natürlichem Glanz. Perfekt für klassische und moderne Styles. Spendet Feuchtigkeit und pflegt das Haar.', 'Auf das handtuchtrockene oder trockene Haar auftragen und nach Wunsch stylen. Für mehr Halt auf trockenes Haar anwenden.', 26.90, 'TAIL-CREAM', true, 22, 5, '/lovable-uploads/37f2682a-5140-4c84-9c39-622ba6610500.png', 2, true),
    (gen_random_uuid(), cat_tailors, 'TAILOR''s Gel', 'Styling Gel für starken Halt und Glanz', 'Professionelles Styling-Gel mit starkem Halt und glänzendem Finish. Ideal für elegante und formal Looks. Wasserlöslich und easy zu verwenden.', 'Auf das feuchte Haar auftragen und in Form kämmen. Lufttrocknen lassen oder kurz föhnen für extra Halt.', 24.50, 'TAIL-GEL', true, 20, 4, '/lovable-uploads/139cd999-5d11-4213-b197-68656293fb61.png', 3, true),
    (gen_random_uuid(), cat_tailors, 'TAILOR''s Pomade', 'Klassische Pomade für Vintage-Styles', 'Traditionelle Pomade auf Wasserbasis für klassische Vintage-Looks. Starker Halt mit glänzendem Finish. Lässt sich leicht auswaschen und neu stylen.', 'Mit den Fingern eine kleine Menge aufnehmen und gleichmäßig im Haar verteilen. Mit einem Kamm in Form bringen.', 29.90, 'TAIL-POMADE', true, 18, 4, '/lovable-uploads/84750b8d-5a51-49a8-a7af-7086c97f27fb.png', 4, true),
    (gen_random_uuid(), cat_tailors, 'TAILOR''s Salt Spray', 'Meersalz-Spray für Beach-Look', 'Texturierendes Meersalz-Spray für natürlichen Beach-Look und Volumen. Verleiht dem Haar Griff und Definition ohne zu beschweren.', 'Auf das handtuchtrockene Haar sprühen und mit den Fingern einkneten für natürliche Textur. Lufttrocknen lassen.', 21.90, 'TAIL-SALT', true, 24, 5, '/lovable-uploads/d05cfe2e-fc33-4e09-baa7-937af2a344d5.png', 5, true),
    (gen_random_uuid(), cat_tailors, 'TAILOR''s Wax', 'Styling Wax für flexiblen Halt', 'Flexibles Styling-Wax für kreative Looks und Re-Styling während des Tages. Mittlerer Halt mit mattem bis leicht glänzendem Finish.', 'Eine kleine Menge zwischen den Handflächen erwärmen und in das trockene Haar einarbeiten. Bei Bedarf nachstylen.', 27.50, 'TAIL-WAX', true, 19, 4, '/lovable-uploads/56f51a2f-c9cf-4fbc-86ce-71758f61ed28.png', 6, true);

  -- Insert Accessories
  INSERT INTO products (id, category_id, name, description, detailed_description, usage_instructions, price, sku, track_inventory, stock_quantity, low_stock_threshold, image_url, sort_order, is_active) VALUES
    (gen_random_uuid(), cat_accessoires, 'Profi-Haartrockner 2000W', 'Professioneller Salon-Haartrockner', 'Leistungsstarker Salon-Haartrockner mit 2000W Motor und Ionentechnologie. Reduziert Frizz und sorgt für glänzendes, gesundes Haar. Mit verschiedenen Aufsätzen für professionelle Ergebnisse.', 'Verschiedene Temperaturstufen für unterschiedliche Haartypen. Kaltlufttaste zum Fixieren des Styles.', 189.00, 'ACC-DRYER-2000', true, 5, 1, '/assets/accessories/hair-dryer.jpg', 1, true),
    (gen_random_uuid(), cat_accessoires, 'Elektrischer Rasierer Premium', 'Hochwertiger elektrischer Rasierer', 'Premium elektrischer Rasierer mit präzisen Klingen für eine gründliche und schonende Rasur. Wasserdicht und mit verschiedenen Aufsätzen für Bart und Körper.', 'Vor Gebrauch vollständig aufladen. Kann trocken oder nass verwendet werden.', 129.00, 'ACC-ELEC-RAZOR', true, 8, 2, '/assets/accessories/electric-razor.jpg', 2, true),
    (gen_random_uuid(), cat_accessoires, 'Traditioneller Rasierer Set', 'Klassisches Rasierer-Set mit Zubehör', 'Hochwertiges traditionelles Rasierer-Set mit Rasiermesser, Rasierpinsel und Seife. Für die klassische, gründliche Rasur wie beim Barbier.', 'Mit Rasierschaum oder -seife verwenden. Klinge regelmäßig schärfen lassen.', 89.00, 'ACC-TRAD-RAZOR', true, 6, 1, '/assets/accessories/traditional-razor.jpg', 3, true);

END $$;