import xlsx from 'xlsx';
import fs from 'fs';

function readExcel(filename) {
  try {
    const workbook = xlsx.readFile(filename);
    let output = `\n==================== ${filename} ====================\n`;
    for (let sheetName of workbook.SheetNames) {
       const worksheet = workbook.Sheets[sheetName];
       output += `\n\n--- Sheet: ${sheetName} ---\n`;
       output += xlsx.utils.sheet_to_csv(worksheet);
    }
    return output;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return '';
  }
}

let finalOutput = readExcel('FORMAT ADMINISTRASI.xlsx');
fs.writeFileSync('admin_format.txt', finalOutput);
console.log('Successfully wrote to admin_format.txt');
