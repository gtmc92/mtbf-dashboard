UPDATE "RepairTypeRecord"
SET "repairType" = '제작설치'
WHERE "repairType" = '일반제작';

UPDATE "RepairTypeRecord"
SET "repairItem" = '제작설치'
WHERE "repairItem" = '일반제작';

UPDATE "RepairTypeMaster"
SET "repairType" = '제작설치',
    "managementType" = 'Non-Repair'
WHERE "repairType" = '일반제작';

UPDATE "UploadStagingRow"
SET "data" = jsonb_set("data"::jsonb, '{repairType}', '"제작설치"', false)
WHERE "data"::jsonb ->> 'repairType' = '일반제작';

UPDATE "UploadStagingRow"
SET "data" = jsonb_set("data"::jsonb, '{repairItem}', '"제작설치"', false)
WHERE "data"::jsonb ->> 'repairItem' = '일반제작';

UPDATE "UploadBatch"
SET "backupData" = replace("backupData"::text, '일반제작', '제작설치')::jsonb
WHERE "backupData"::text LIKE '%일반제작%';
