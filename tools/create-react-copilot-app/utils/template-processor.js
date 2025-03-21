import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Process a template file, replacing placeholders with values
 * @param {string} templatePath - Path to the template file
 * @param {string} outputPath - Path to write the processed file
 * @param {Object} variables - Object containing variables to replace in the template
 */
export async function processTemplate(templatePath, outputPath, variables) {
  try {
    // Read the template file
    let content = await fs.readFile(templatePath, 'utf8');
    
    // Replace variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }
    
    // Make sure the output directory exists
    await fs.ensureDir(path.dirname(outputPath));
    
    // Write the processed file
    await fs.writeFile(outputPath, content);
    
    return true;
  } catch (error) {
    console.error(chalk.red(`Error processing template ${templatePath}: ${error.message}`));
    return false;
  }
}

/**
 * Process an entire template directory, copying files and processing template files
 * @param {string} templateDir - Path to the template directory
 * @param {string} outputDir - Path to the output directory
 * @param {Object} variables - Object containing variables to replace in templates
 * @param {Object} options - Additional options
 */
export async function processTemplateDir(templateDir, outputDir, variables, options = {}) {
  const { 
    fileExtensionMap = {}, 
    typescript = false,
    skipExtensions = []
  } = options;
  
  // Get all files in the template directory
  const files = await fs.readdir(templateDir, { withFileTypes: true });
  
  for (const file of files) {
    const sourcePath = path.join(templateDir, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      await processTemplateDir(
        sourcePath, 
        path.join(outputDir, file.name),
        variables,
        options
      );
      continue;
    }
    
    // Handle the file based on its extension
    const extension = path.extname(file.name);
    
    // Skip files with extensions in the skipExtensions array
    if (skipExtensions.includes(extension)) {
      continue;
    }
    
    // Process template files
    if (extension === '.template') {
      // Get the base name without the .template extension
      const baseFileName = path.basename(file.name, '.template');
      
      // Check if we need to map the file extension based on typescript option
      let outputFileName = baseFileName;
      const baseExt = path.extname(baseFileName);
      
      // If we have a mapping for this extension and typescript is enabled, use it
      if (baseExt && fileExtensionMap[baseExt] && typescript) {
        outputFileName = path.basename(baseFileName, baseExt) + fileExtensionMap[baseExt];
      }
      
      await processTemplate(
        sourcePath,
        path.join(outputDir, outputFileName),
        variables
      );
    } else {
      // Copy non-template files as-is
      await fs.copy(sourcePath, path.join(outputDir, file.name));
    }
  }
}