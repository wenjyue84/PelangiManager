
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function cleanProcesses() {
  console.log('🧹 Cleaning up processes...');

  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // Windows: kill tsx.exe
      // 2>nul suppresses error if process not found
      await execAsync('taskkill /F /IM "tsx.exe" 2>nul || echo "No tsx processes found"');
      console.log('✅ Windows: Cleaned up tsx processes');
    } else {
      // Unix/Linux (including Replit): kill tsx watch
      // This matches the original safe behavior for Replit environments
      await execAsync('pkill -f "tsx watch" || echo "No tsx processes found"');
      console.log('✅ Unix: Cleaned up tsx processes');
    }
  } catch (error) {
    // Ignore errors if no processes found (the command already handles some, but just in case)
    console.log('ℹ️  No processes needed cleanup or cleanup finished');
  }
}

cleanProcesses();
