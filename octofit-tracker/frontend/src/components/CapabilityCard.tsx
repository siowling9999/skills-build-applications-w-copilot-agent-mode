import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  dataKey: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({
  title,
  description,
  endpoint,
  dataKey,
  emptyText,
  renderItem,
}: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);

    getJson<Record<string, T[]>>(endpoint)
      .then((data) => {
        if (active) setItems(data[dataKey] ?? []);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load data');
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint, dataKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {items === null && error === null && (
          <p role="status" aria-live="polite">Loading {title.toLowerCase()}...</p>
        )}
        {error !== null && (
          <p role="alert" className="text-danger">Unable to load {title.toLowerCase()}: {error}</p>
        )}
        {items !== null && error === null && items.length === 0 && (
          <p>{emptyText}</p>
        )}
        {items !== null && error === null && items.length > 0 && (
          <ul className="mb-0">
            {items.map((item, index) => (
              <li key={index}>{renderItem(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
