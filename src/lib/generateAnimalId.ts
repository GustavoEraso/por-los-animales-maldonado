export async function generateAnimalId (name: string): Promise<string> {
  const res = await fetch('/api/generate-animal-id', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET!,
     },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();
  return data.id;
};