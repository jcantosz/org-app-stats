import { Octokit } from '@octokit/rest';
import { handleError } from './errorHandler.js';
import core from '@actions/core';

/**
 * Fetches all app installations for a GitHub organization
 * @param {Object} config - The configuration object
 * @returns {Promise<Object>} - Organization installation data
 */
export async function getOrgInstallations(config) {
  return handleError(async () => {
    const installationsData = await fetchInstallationsData(config);
    
    const { orgWideInstallations, repoSpecificInstallations } = categorizeInstallations(installationsData);
    
    core.info(`Organization-wide installations: ${orgWideInstallations.length}`);
    core.info(`Repository-specific installations: ${repoSpecificInstallations.length}`);
    
    return {
      orgWideInstallations,
      repoSpecificInstallations
    };
  }, 'Error fetching installations');
}

/**
 * Fetches installation data from GitHub API
 * @param {Object} config - The configuration object
 * @returns {Promise<Object>} - Raw installation data
 */
async function fetchInstallationsData(config) {
  const { data: installationsData } = await config.github.octokit.request('GET /orgs/{org}/installations', {
    org: config.github.orgName,
    headers: {
      'X-GitHub-Api-Version': config.github.apiVersion
    }
  });
  core.info(`Found ${installationsData.installations.length} total app installations for ${config.github.orgName}`);
  return installationsData;
}

/**
 * Categorizes installations into org-wide and repo-specific
 * @param {Object} installationsData - Raw installation data
 * @returns {Object} - Categorized installations
 */
function categorizeInstallations(installationsData) {
  let orgWideInstallations = [];
  let repoSpecificInstallations = [];
  
  installationsData.installations.forEach(installation => {
    if (installation.repository_selection === 'all') {
      orgWideInstallations.push({
        id: installation.id,
        app_name: installation.app_slug || installation.app_id
      });
    } else if (installation.repository_selection === 'selected') {
      repoSpecificInstallations.push({
        id: installation.id,
        app_name: installation.app_slug || installation.app_id
      });
    }
  });
  
  return { orgWideInstallations, repoSpecificInstallations };
}

/**
 * Fetches repositories for a specific app installation
 * @param {number} installationId - The installation ID
 * @param {Object} config - The configuration object
 * @returns {Promise<Array>} - List of repositories
 */
export async function getInstallationRepositories(installationId, config) {
  return handleError(async () => {
    const { data: reposData } = await config.github.octokit.request('GET /user/installations/{installation_id}/repositories', {
      installation_id: installationId,
      headers: {
        'X-GitHub-Api-Version': config.github.apiVersion
      }
    });
    
    return reposData.repositories.map(repo => repo.name);
  }, `Error fetching repositories for installation ${installationId}`);
}