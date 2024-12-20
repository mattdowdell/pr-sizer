const core = require('@actions/core');
const github = require('@actions/github');
const rest = require('@octokit/rest');

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);

  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

} catch (error) {
  core.setFailed(error.message);
}

/*
using: "composite"
steps:
  - name: Create labels
  - name: Gather excludes
  - name: Calculate size
  - name: Select label
  - name: Assign label
*/
