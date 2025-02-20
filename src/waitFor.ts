export const wait = async (timeToWait: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeToWait);
  });
};

export const waitToExist = async <T>(
  tryLoad: () => Promise<T | null>,
  retryInterval: number,
  timesToRetry: number,
): Promise<T | null> => {
  const result = await tryLoad();

  if (result !== null) return result;
  else {
    if (timesToRetry === 0) return null;
    await wait(retryInterval);

    return await waitToExist(tryLoad, retryInterval, timesToRetry - 1);
  }
};
