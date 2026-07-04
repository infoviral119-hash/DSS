DROP POLICY IF EXISTS "cases_select_all" ON cases;
DROP POLICY IF EXISTS "cases_insert_all" ON cases;
DROP POLICY IF EXISTS "cases_update_all" ON cases;
DROP POLICY IF EXISTS "cases_delete_all" ON cases;
DROP POLICY IF EXISTS "import_batches_select" ON import_batches;
DROP POLICY IF EXISTS "import_batches_insert" ON import_batches;
DROP POLICY IF EXISTS "import_batches_update" ON import_batches;

CREATE POLICY "cases_select_all" ON cases FOR SELECT USING (true);
CREATE POLICY "cases_insert_all" ON cases FOR INSERT WITH CHECK (true);
CREATE POLICY "cases_update_all" ON cases FOR UPDATE USING (true);
CREATE POLICY "cases_delete_all" ON cases FOR DELETE USING (true);

CREATE POLICY "import_batches_select" ON import_batches FOR SELECT USING (true);
CREATE POLICY "import_batches_insert" ON import_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "import_batches_update" ON import_batches FOR UPDATE USING (true);
