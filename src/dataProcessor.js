import { getOrgInstallations, getInstallationRepositories } from './githubService.js';
import { handleError } from './errorHandler.js';
import core from '@actions/core';

/**
 * Process GitHub app installation data for an organization
 * @param {Object} config - The configuration object
 * @returns {Promise<Object>} - Processed installation data
 */
export async function processInstallationData(config) {
  return handleError(async () => {
    // Get basic installation data
    const { orgWideInstallations, repoSpecificInstallations } = await getOrgInstallations(config);
    
    // Get repositories for installations with "selected" repository selection
    const installationRepos = {};
    const repoApps = {}; // To track which apps are installed in which repos
    
    // Process each repository-specific installation
    await processRepoSpecificInstallations(repoSpecificInstallations, installationRepos, repoApps, config);
    
    core.info('Installation data processed successfully');
    return {
      orgName: config.github.orgName,
      orgWideInstallations,
      repoSpecificInstallations,
      installationRepos,
      repoApps
    };
  }, 'Error processing installation data');
}

/**
 * Process each repository-specific installation
 * @param {Array} repoSpecificInstallations - List of repository-specific installations
 * @param {Object} installationRepos - Object to store installation repositories
 * @param {Object} repoApps - Object to track apps installed in each repo
 * @param {Object} config - The configuration object
 * @returns {Promise<void>}
 */
async function processRepoSpecificInstallations(repoSpecificInstallations, installationRepos, repoApps, config) {
  for (const installation of repoSpecificInstallations) {
    const repoNames = await getInstallationRepositories(installation.id, config);
    installationRepos[installation.app_name] = repoNames;
    
    // Track apps installed in each repo
    repoNames.forEach(repoName => {
      if (!repoApps[repoName]) {
        repoApps[repoName] = [];
      }
      repoApps[repoName].push(installation.app_name);
    });
    
    core.info(`App: ${installation.app_name}, Installation ID: ${installation.id}, Repos: ${repoNames.length}`);
  }
}

/**
 * Prepare data for the per-repo installations CSV
 * @param {Object} data - Processed installation data
 * @returns {Array<Object>} - Data formatted for CSV
 */
export function preparePerRepoInstallationsData(data) {
  const repoInstallationsData = [];
  
  // Add repository-specific installations
  for (const [repoName, apps] of Object.entries(data.repoApps)) {
    repoInstallationsData.push({
      org_name: data.orgName,
      repo_name: repoName,
      app_installations: apps.length
    });
  }
  
  // Add a special entry for org-wide apps
  if (data.orgWideInstallations.length > 0) {
    repoInstallationsData.push({
      org_name: data.orgName,
      repo_name: "_ORG_LEVEL_",
      app_installations: data.orgWideInstallations.length
    });
  }
  
  return repoInstallationsData;
}

/**
 * Prepare data for the repo-app details CSV
 * @param {Object} data - Processed installation data
 * @returns {Array<Object>} - Data formatted for CSV
 */
export function prepareRepoAppDetailsData(data) {
  const repoAppDetailsData = [];
  
  // Add repository-specific installations
  for (const [repoName, apps] of Object.entries(data.repoApps)) {
    apps.forEach(appName => {
      repoAppDetailsData.push({
        org_name: data.orgName,
        repo_name: repoName,
        app_name: appName,
        configured: 'TRUE'
      });
    });
  }
  
  // Add org-wide apps
  data.orgWideInstallations.forEach(installation => {
    repoAppDetailsData.push({
      org_name: data.orgName,
      repo_name: "_ORG_LEVEL_",
      app_name: installation.app_name,
      configured: 'TRUE'
    });
  });
  
  return repoAppDetailsData;
}

/**
 * Prepare data for the app-repos CSV
 * @param {Object} data - Processed installation data
 * @returns {Array<Object>} - Data formatted for CSV
 */
export function prepareAppReposData(data) {
  const appReposData = [];
  
  for (const [appName, repos] of Object.entries(data.installationRepos)) {
    appReposData.push({
      org_name: data.orgName,
      app_name: appName,
      repos_installed_in: repos.length
    });
  }
  
  return appReposData;
}