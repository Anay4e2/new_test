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

    const analysis: any = {};

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length > 0) {
            const cols = Object.keys(data[0] as object);
            analysis[sheetName] = {
                rowCount: data.length,
                columns: cols,
                sampleRow: data[0]
            };
        }
    });

    fs.writeFileSync('sheet_analysis.json', JSON.stringify(analysis, null, 2));
    console.log('Analysis written to sheet_analysis.json');
    process.exit(0);
});
