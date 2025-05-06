const { exec } = require('child_process');

exec('echo "+ private_messages           create table" | npx drizzle-kit push', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Schema pushed successfully:\n${stdout}`);
});
