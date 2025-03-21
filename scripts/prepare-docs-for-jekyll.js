#!/usr/bin/env node

/**
 * This script adds basic YAML front matter to markdown files in the docs directory
 * to prepare them for use with Jekyll, without requiring a local Jekyll installation.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

// Get the current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const docsDir = path.join(__dirname, '..', 'docs');
const navOrder = {
  'index.md': 1,
  'installation-guide.md': 2, 
  'getting-started.md': 3,
  'api-reference.md': 4,
  'architecture.md': 5,
  'examples.md': 6,
  'troubleshooting.md': 7,
  'create-react-copilot-app.md': 8,
  'sample-prompts.md': 9,
  // Subdirectories
  'components/README.md': 10,
  'hooks/README.md': 20,
  'plugins/README.md': 30,
  'advanced/README.md': 40,
};

// Function to generate front matter based on file path
function generateFrontMatter(filePath, content) {
  const relativePath = path.relative(docsDir, filePath);
  const fileBasename = path.basename(filePath);
  const fileDir = path.dirname(relativePath);
  
  // Extract first h1 title from content, or use filename
  let title = fileBasename.replace('.md', '');
  const titleMatch = content.match(/^# (.*)/m);
  if (titleMatch) {
    title = titleMatch[1];
  }
  
  // Determine parent and nav_order
  let parent = null;
  let navOrderValue = 999; // Default nav order
  
  if (fileDir !== '.') {
    // Handle nested directory structure
    if (fileBasename === 'README.md') {
      parent = null; // Section READMEs are top level
    } else {
      // Get the README.md title from the same directory if it exists
      const readmePath = path.join(path.dirname(filePath), 'README.md');
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const readmeTitleMatch = readmeContent.match(/^# (.*)/m);
        if (readmeTitleMatch) {
          parent = readmeTitleMatch[1];
        } else {
          parent = path.basename(fileDir);
        }
      } else {
        parent = path.basename(fileDir);
      }
    }
  }
  
  // Use predefined nav_order if available
  if (relativePath in navOrder) {
    navOrderValue = navOrder[relativePath];
  } else if (parent) {
    // For child pages, use alphabetical order within sections
    navOrderValue = 999;
  }
  
  // Generate permalink
  let permalink = `/${relativePath.replace(/\.md$/, '').replace(/README$/, '')}`;
  if (permalink.endsWith('/')) {
    permalink = permalink.slice(0, -1);
  }
  
  // Build front matter
  let frontMatter = [
    '---',
    `title: ${title}`,
    `nav_order: ${navOrderValue}`,
  ];
  
  if (parent) {
    frontMatter.push(`parent: ${parent}`);
  }
  
  // Add has_children for section READMEs
  if (fileBasename === 'README.md') {
    frontMatter.push('has_children: true');
  }
  
  frontMatter.push(`permalink: ${permalink}`);
  frontMatter.push('---\n');
  
  return frontMatter.join('\n');
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that already have front matter
    if (content.startsWith('---\n')) {
      console.log(`Skipping ${path.relative(docsDir, filePath)} (already has front matter)`);
      return false;
    }
    
    // Generate front matter
    const frontMatter = generateFrontMatter(filePath, content);
    const newContent = `${frontMatter}${content}`;
    
    // Write updated content back to file
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${path.relative(docsDir, filePath)}`);
    return true;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Main function to process all markdown files
function processMarkdownFiles() {
  try {
    // Use fs.readdirSync and recursively traverse instead of glob
    const files = [];
    function traverseDirectory(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          traverseDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    traverseDirectory(docsDir);
    console.log(`Processing ${files.length} markdown files in ${docsDir}...`);
    
    let updatedCount = 0;
    for (const file of files) {
      if (processFile(file)) {
        updatedCount++;
      }
    }
    
    console.log(`\nDone! Updated ${updatedCount} files.`);
  } catch (error) {
    console.error('Error processing markdown files:', error);
    process.exit(1);
  }
}

// Execute the script
processMarkdownFiles();