import { fileURLToPath } from 'url';
import path from 'path';
import core from '@actions/core';
import fetch from "node-fetch";
import { Octokit } from '@octokit/rest';
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const MyOctokit = Octokit.plugin(paginateRest, retry, throttling);
// Function to generate configuration
export function createConfig() {
  const config = {
    // GitHub settings
    github: {
      token: core.getInput('GITHUB_TOKEN'),
      orgName: core.getInput('GITHUB_ORG'),
      apiVersion: '2022-11-28',
      octokit: new MyOctokit({
        auth: core.getInput('GITHUB_TOKEN'),
        request: { fetch },
        log: core.isDebug() ? console : null,
        throttle: {
          onRateLimit: (retryAfter, options, octokit, retryCount) => {
            octokit.log.warn(
              `Request quota exhausted for request ${options.method} ${options.url}`,
            );

            if (retryCount < 1) {
              // only retries once
              octokit.log.info(`Retrying after ${retryAfter} seconds!`);
              return true;
            }
          },
          onSecondaryRateLimit: (retryAfter, options, octokit) => {
            // does not retry, only logs a warning
            octokit.log.warn(
              `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
            );
          },
          onAbuseLimit: (retryAfter, options) => {
            console.warn(
              `Abuse detected for request ${options.method} ${options.url}`,
            );
            return true;
          },
        },
      })
    },
    // Output settings
    output: {
      dir: core.getInput('output_dir'),
      files: {
        perRepoInstallations: core.getInput('per_repo_installations_csv'),
        repoAppDetails: core.getInput('repo_app_details_csv'),
        appRepos: core.getInput('app_repos_csv')
      }
    }
  };

  // Validate required config
  if (!config.github.token) {
    core.setFailed('GITHUB_TOKEN input is required');
    throw new Error('GITHUB_TOKEN input is required');
  }
  
  if (!config.github.orgName) {
    core.setFailed('No organization name defined. Set GITHUB_ORG input to specify your organization.');
    throw new Error('No organization name defined. Set GITHUB_ORG input to specify your organization.');
  }
  
  core.info('Configuration validated successfully');
  return config;
}