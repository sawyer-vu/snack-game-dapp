export const usePlayerName = () => {
  const STORAGE_KEY = "snack-game-player-name";

  const playerName = useState<string>("playerName", () => {
    if (process.client) {
      return localStorage.getItem(STORAGE_KEY) || "";
    }
    return "";
  });

  const isDialogOpen = useState<boolean>("playerNameDialogOpen", () => false);

  const setPlayerName = (name: string) => {
    playerName.value = name;
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, name);
    }
  };

  const openDialog = () => {
    isDialogOpen.value = true;
  };

  const closeDialog = () => {
    isDialogOpen.value = false;
  };

  return {
    playerName,
    isDialogOpen,
    setPlayerName,
    openDialog,
    closeDialog,
  };
};
