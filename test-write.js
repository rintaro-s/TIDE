const fs = require('fs/promises');
const path = require('path');

async function test() {
  const filePath = "C:\\Users\\s-rin\\Music\\e\\7\\src\\main.cpp";
  const normalizedPath = path.normalize(filePath);
  
  console.log('Original path:', filePath);
  console.log('Normalized path:', normalizedPath);
  
  // Read current content
  const currentContent = await fs.readFile(normalizedPath, 'utf-8');
  console.log('Current content:', currentContent);
  
  // Write new content
  const newContent = "TEST WRITE FROM NODE " + Date.now();
  await fs.writeFile(normalizedPath, newContent, 'utf-8');
  console.log('Write completed');
  
  // Read again to verify
  const verifyContent = await fs.readFile(normalizedPath, 'utf-8');
  console.log('Verified content:', verifyContent);
}

test().catch(console.error);
