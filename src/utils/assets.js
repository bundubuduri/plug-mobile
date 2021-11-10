export const CYCLES_PER_TC = 1_000_000_000_000;
export const USD_PER_TC = 1.42656;
export const E8S_PER_ICP = 100_000_000;

export const TOKEN_IMAGES = {
  XTC: 'xtc',
  ICP: 'dfinity',
};

export const CURRENCIES = new Map([
  [
    'ICP',
    {
      id: 'ICP',
      name: 'ICP',
      value: 'ICP',
      symbol: 'ICP',
      image: TOKEN_IMAGES.ICP,
    },
  ],
  [
    'XTC',
    {
      id: 'XTC',
      name: 'Cycles',
      value: 'XTC',
      image: TOKEN_IMAGES.XTC,
      symbol: 'XTC',
      price: USD_PER_TC,
    },
  ],
]);

export const formatAssetBySymbol = (_amount, symbol, icpPrice) => {
  const amount = parseInt(_amount?.toString(), 10);
  return (
    {
      ICP: {
        amount: amount / E8S_PER_ICP,
        value: (amount * icpPrice) / E8S_PER_ICP,
        icon: TOKEN_IMAGES.ICP,
        symbol: 'ICP',
      },
      XTC: {
        amount: amount / CYCLES_PER_TC,
        value: (amount * USD_PER_TC) / CYCLES_PER_TC,
        icon: TOKEN_IMAGES.XTC,
        symbol: 'XTC',
      },
      WTC: {
        amount: amount / CYCLES_PER_TC,
        value: (amount * USD_PER_TC) / CYCLES_PER_TC,
        symbol: 'WTC',
      },
      default: { amount, value: amount },
    }[symbol || 'default'] || { amount, value: amount }
  );
};

export const formatAssets = (assets = [], icpPrice) => {
  const mappedAssets = assets.map(({ amount, name, symbol, canisterId }) => {
    const asset = formatAssetBySymbol(amount, symbol, icpPrice);
    return {
      ...asset,
      name,
      symbol,
      canisterId,
    };
  });
  return mappedAssets;
};
