import type { Backup } from "~/types/Backup";

export const useBackups = (serverName: string) => {
    const backups = useState<Backup[]>(`backups-${serverName}`, () => []);
    const loading = useState<boolean>(`backups-loading-${serverName}`, () => false);

    const fetchBackups = async () => {
        loading.value = true;
        try {
            const data = await $fetch<Backup[]>(`/api/getBackups`, {
                query: { name: serverName },
                headers: { Authorization: `Bearer ${useCookie('token').value}` }
            });
            backups.value = data;
        } catch (error) {
            console.error('Failed to fetch backups:', error);
        } finally {
            loading.value = false;
        }
    };

    const createBackup = async () => {
        loading.value = true;
        try {
            await $fetch('/api/createBackup', {
                method: 'POST',
                body: { name: serverName },
                headers: { Authorization: `Bearer ${useCookie('token').value}` }
            });
            await fetchBackups();
        } catch (error: any) {
            alert(`Backup failed: ${error.statusMessage || error.message}`);
        } finally {
            loading.value = false;
        }
    };

    const deleteBackup = async (backupName: string) => {
        if (!confirm(`Are you sure you want to delete backup ${backupName}?`)) return;
        loading.value = true;
        try {
            await $fetch('/api/deleteBackup', {
                method: 'POST',
                body: { name: serverName, backupName },
                headers: { Authorization: `Bearer ${useCookie('token').value}` }
            });
            await fetchBackups();
        } catch (error: any) {
            alert(`Delete failed: ${error.statusMessage || error.message}`);
        } finally {
            loading.value = false;
        }
    };

    const restoreBackup = async (backupName: string) => {
        if (!confirm(`Are you sure you want to restore ${backupName}? THIS WILL OVERWRITE ALL CURRENT SERVER FILES.`)) return;
        loading.value = true;
        try {
            await $fetch('/api/restoreBackup', {
                method: 'POST',
                body: { name: serverName, backupName },
                headers: { Authorization: `Bearer ${useCookie('token').value}` }
            });
            alert('Backup restored successfully!');
        } catch (error: any) {
            alert(`Restore failed: ${error.statusMessage || error.message}`);
        } finally {
            loading.value = false;
        }
    };

    return {
        backups,
        loading,
        fetchBackups,
        createBackup,
        deleteBackup,
        restoreBackup
    };
};
