import { useState } from 'react';

export function ProductPhoto({ url, name }: { url?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? <img className="product-photo" src={url} alt={`Foto de ${name}`} onError={() => setFailed(true)}/> : <span className="photo-pending">Foto pendente</span>;
}
