# Project Count GitHub Action

This GitHub Action runs a script to count project-related data and generates CSV files with the results.

Note: A Personal Access Token MUST be used. App tokens are not able to view data about other apps.

## Inputs

- `GITHUB_TOKEN`: GitHub token for authentication (required)
- `GITHUB_ORG`: GitHub organization name (required)
- `OUTPUT_DIR`: Directory to save the output CSV files (default: `csv_output`)
- `PER_REPO_INSTALLATIONS_CSV`: Filename for the per repo installations CSV file (default: `per-repo-installations.csv`)
- `REPO_APP_DETAILS_CSV`: Filename for the repo app details CSV file (default: `repo-app-details.csv`)
- `APP_REPOS_CSV`: Filename for the app repos CSV file (default: `app-repos.csv`)

## Outputs

- `per_repo_installations_csv`: Path to the per repo installations CSV file
- `repo_app_details_csv`: Path to the repo app details CSV file
- `app_repos_csv`: Path to the app repos CSV file

## Example Workflow

```yaml
name: Project Count Workflow

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Run Project Count
      uses: jcantosz/org-app-stats@main
      with:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_ORG: 'your_github_org'
        OUTPUT_DIR: 'csv_output'
        PER_REPO_INSTALLATIONS_CSV: 'per_repo_installations.csv'
        REPO_APP_DETAILS_CSV: 'repo_app_details.csv'
        APP_REPOS_CSV: 'app_repos.csv'
```
