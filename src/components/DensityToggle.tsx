'use client';

import { rawStringSerializer, useLocalStorage } from '@/lib/useLocalStorage';
import { useEffect } from 'react';

const DENSITY_KEY = 'stableroute.density';

export type Density = 'comfortable' | 'compact';

function isDensity(value: unknown): value is Density {
  return value === 'comfortable' || value === 'compact';
}

export function DensityToggle() {
  const [density, setDensity] = useLocalStorage<Density>(
    DENSITY_KEY,
    'comfortable',
    isDensity,
    rawStringSerializer
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  return (
    <fieldset className="flex gap-4">
      <legend className="sr-only">Data density</legend>
      {(['comfortable', 'compact'] as const).map((d) => (
        <label key={d} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="density"
            value={d}
            checked={density === d}
            onChange={() => setDensity(d)}
            className="h-4 w-4 accent-black dark:accent-white"
          />
          {d.charAt(0).toUpperCase() + d.slice(1)}
        </label>
      ))}
    </fieldset>
  );
}
