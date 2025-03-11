import core from '@actions/core';

/**
 * Handles errors by logging them and rethrowing if necessary
 * @param {Function} fn - The function to execute
 * @param {string} errorMessage - The error message to log
 * @returns {Promise<any>} - The result of the function execution
 */
export async function handleError(fn, errorMessage) {
  try {
    return await fn();
  } catch (error) {
    core.setFailed(`${errorMessage}: ${error.message}`);
    if (error.response) {
      core.error(`Status: ${error.response.status}`);
      core.error(`Response body: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}