import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { preparePerRepoInstallationsData, prepareRepoAppDetailsData, prepareAppReposData } from './dataProcessor.js';
import { handleError } from './errorHandler.js';
import core from '@actions/core';

// Ensure the output directory exists
function ensureOutputDir(config) {
  if (!fs.existsSync(config.output.dir)) {
    fs.mkdirSync(config.output.dir);
  }
}

/**
 * Write data to a CSV file
 * @param {string} filePath - The path to the CSV file
 * @param {Array<Object>} data - The data to write
 * @param {Array<Object>} header - The CSV header configuration
 * @returns {Promise<void>}
 */
async function writeCsv(filePath, data, header) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header
  });
  await csvWriter.writeRecords(data);
}

/**
 * Write per-repo installations data to CSV
 * @param {Object} data - The processed installation data
 * @param {Object} config - The configuration object
 * @returns {Promise<void>}
 */
async function writePerRepoInstallationsCsv(data, config) {
  const perRepoInstallationsData = preparePerRepoInstallationsData(data);
  const filePath = path.join(config.output.dir, config.output.files.perRepoInstallations);
  await writeCsv(filePath, perRepoInstallationsData, [
    { id: 'org_name', title: 'org_name' },
    { id: 'repo_name', title: 'repo_name' },
    { id: 'app_installations', title: 'app_installations' }
  ]);
  core.setOutput('per_repo_installations_csv', filePath);
}

/**
 * Write repo-app details data to CSV
 * @param {Object} data - The processed installation data
 * @param {Object} config - The configuration object
 * @returns {Promise<void>}
 */
async function writeRepoAppDetailsCsv(data, config) {
  const repoAppDetailsData = prepareRepoAppDetailsData(data);
  const filePath = path.join(config.output.dir, config.output.files.repoAppDetails);
  await writeCsv(filePath, repoAppDetailsData, [
    { id: 'org_name', title: 'org_name' },
    { id: 'repo_name', title: 'repo_name' },
    { id: 'app_name', title: 'app-name' },
    { id: 'configured', title: 'configured' }
  ]);
  core.setOutput('repo_app_details_csv', filePath);
}

/**
 * Write app-repos data to CSV
 * @param {Object} data - The processed installation data
 * @param {Object} config - The configuration object
 * @returns {Promise<void>}
 */
async function writeAppReposCsv(data, config) {
  const appReposData = prepareAppReposData(data);
  const filePath = path.join(config.output.dir, config.output.files.appRepos);
  await writeCsv(filePath, appReposData, [
    { id: 'org_name', title: 'org_name' },
    { id: 'app_name', title: 'app_name' },
    { id: 'repos_installed_in', title: 'repos_installed_in' }
  ]);
  core.setOutput('app_repos_csv', filePath);
}

/**
 * Generate all CSV files
 * @param {Object} data - The processed installation data
 * @param {Object} config - The configuration object
 * @returns {Promise<void>}
 */
export async function generateCsvFiles(data, config) {
  await handleError(async () => {
    ensureOutputDir(config);
    await writePerRepoInstallationsCsv(data, config);
    await writeRepoAppDetailsCsv(data, config);
    await writeAppReposCsv(data, config);
    core.info(`CSV files have been written to ${config.output.dir}`);
    core.info('- per_repo_installations.csv: org_name, repo_name, app_installations');
    core.info('- repo_app_details.csv: org_name, repo_name, app-name, configured');
    core.info('- app_repos.csv: org_name, app_name, repos_installed_in (count)');
  }, 'Error writing CSV files');
}