export const useSystemStats = () => {
  const stats = useState<any>('system-stats', () => ({
    memory: { total: '0', used: '0', percent: '0' },
    cpu: { percent: '0', load: '0', cores: 0 }
  }));

  const fetchStats = async () => {
    try {
      const data = await $fetch('/api/getSystemStats', {
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      });
      stats.value = data;
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  return {
    stats,
    fetchStats
  };
};
