import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const excelsDir = path.join(__dirname, '../../../excels');
const files = fs.readdirSync(excelsDir).filter(file => file.includes('North_India_Tourism.xlsx'));

console.log(`Found ${files.length} Excel files\n`);

files.forEach(file => {
    console.log(`\n=== ${file} ===`);
    const filePath = path.join(excelsDir, file);
    const workbook = XLSX.readFile(filePath);

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // process.exit(0); // commented out
        const columns = Object.keys(data[0] as object);
        console.log(`SHEET: ${sheetName} | ROWS: ${data.length} | FIRST_COLS: ${JSON.stringify(columns.slice(0, 5))}`);
    });
});
