import os from 'os';

export default defineEventHandler(() => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  // Convert to GB for easier display
  const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(1);
  const usedGB = (usedMem / (1024 * 1024 * 1024)).toFixed(1);
  const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

  // CPU Load average for the last minute
  // On Linux, loadavg[0] is the 1-minute load average.
  // To get a percentage, we divide by the number of cores.
  const cores = os.cpus().length;
  const load = os.loadavg()[0];
  const cpuPercent = Math.min(100, (load / cores) * 100).toFixed(1);

  return {
    memory: {
      total: totalGB,
      used: usedGB,
      percent: memPercent
    },
    cpu: {
      percent: cpuPercent,
      load: load.toFixed(2),
      cores: cores
    }
  };
});
