import { useState } from 'react';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; lat: number; lon: number }
  | { status: 'denied'; error: string };

export const useGeolocation = () => {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const request = () => {
    if (!navigator.geolocation) {
      setState({ status: 'denied', error: 'Geolocation not supported by this browser' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({ status: 'granted', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) =>
        setState({ status: 'denied', error: err.message }),
      { timeout: 10_000 },
    );
  };

  return { ...state, request };
};
