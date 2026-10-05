/**
 * CSV Parser & Analyzer Unit Tests
 */

import { parseCSVText, isMissingValue, isNumeric, analyzeCSV } from '../src/utils/csvParser.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

console.log('--- Testing CSV Parsing & Tokenization ---');

// Test 1: Simple CSV
const csv1 = `Hours,Score,Student
2.5,65,Alice
3.0,70,Bob
5.0,85,Charlie
7.5,92,Diana`;
const parsed1 = parseCSVText(csv1);
assert(parsed1.length === 5, 'Parses 5 rows including header');
assert(parsed1[0].length === 3, 'First row has 3 columns');
assert(parsed1[1][0] === '2.5', 'Cell value matching');

// Test 2: Quoted fields with commas and escaped quotes
const csv2 = `"Name","Description","Value"
"Item A","A fast, reliable ""widget""",100
"Item B","Simple item",200`;
const parsed2 = parseCSVText(csv2);
assert(parsed2.length === 3, 'Parses quoted multiline and comma entries');
assert(parsed2[1][1] === 'A fast, reliable "widget"', 'Handles escaped double quotes inside quotes');

// Test 3: Missing value checks
assert(isMissingValue(''), 'Empty string is missing');
assert(isMissingValue('NA'), 'NA is missing');
assert(isMissingValue('null'), 'null is missing');
assert(isMissingValue('-'), '- is missing');
assert(!isMissingValue('42'), '42 is not missing');

// Test 4: Numeric checks
assert(isNumeric('42'), '42 is numeric');
assert(isNumeric('-3.1415'), '-3.1415 is numeric');
assert(!isNumeric('hello'), 'hello is not numeric');
assert(!isNumeric(''), 'empty is not numeric');

// Test 5: Full analyzeCSV on valid dataset
const fileMock = { name: 'students_scores.csv', size: 1024 };
const result1 = analyzeCSV(fileMock, csv1);
assert(result1.isValid === true, 'Dataset marked valid');
assert(result1.rowCount === 4, 'Row count is 4');
assert(result1.columnCount === 3, 'Column count is 3');
assert(result1.numericalColumns.includes('Hours') && result1.numericalColumns.includes('Score'), 'Identifies Hours and Score as numerical');
assert(!result1.numericalColumns.includes('Student'), 'Student is not numerical');

// Test 6: Empty file
const resultEmpty = analyzeCSV(fileMock, '');
assert(resultEmpty.isValid === false, 'Empty file marked invalid');

// Test 7: Headers only
const resultHeaderOnly = analyzeCSV(fileMock, 'ColA,ColB,ColC');
assert(resultHeaderOnly.isValid === false, 'Header-only file marked invalid');

// Test 8: Less than 2 numerical columns warning
const csvSingleNum = `Name,Age,City
Alice,25,New York
Bob,30,London
Charlie,35,Paris`;
const resultSingleNum = analyzeCSV(fileMock, csvSingleNum);
assert(resultSingleNum.isValid === true, 'Dataset valid');
assert(resultSingleNum.numericalColumns.length === 1, 'Only 1 numerical column');
assert(resultSingleNum.warnings.length > 0, 'Produces warning about insufficient numerical columns');

console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
