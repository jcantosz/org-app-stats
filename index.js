import { createConfig } from './src/config.js';
import { processInstallationData } from './src/dataProcessor.js';
import { generateCsvFiles } from './src/csvWriter.js';
import { handleError } from './src/errorHandler.js';
import core from '@actions/core';

// Main execution function
async function main() {
  await handleError(async () => {
    try {
      // Create and validate configuration
      const config = createConfig();
      
      core.info(JSON.stringify(config, null, 2));
      // Process installation data
      const results = await processInstallationData(config);
      
      core.info('\n--- Summary ---');
      core.info(`Organization: ${config.github.orgName}`);
      core.info(`Organization-wide app installations: ${results.orgWideInstallations.length}`);
      core.info(`Repository-specific app installations: ${results.repoSpecificInstallations.length}`);
      
      // Display repos for each app installation
      core.info('\n--- Apps with selected repositories ---');
      for (const [appName, repos] of Object.entries(results.installationRepos)) {
        core.info(`\nApp: ${appName}`);
        core.info(`Repositories (${repos.length}):`);
        repos.forEach(repo => core.info(`- ${repo}`));
      }
      
      // Generate CSV output files
      await generateCsvFiles(results, config);      
    } catch (error) {
      core.setFailed(`Execution failed: ${error.message}`);
    }
  });
}

main();