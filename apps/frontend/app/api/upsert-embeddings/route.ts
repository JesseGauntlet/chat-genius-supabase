import { upsertEmbeddings } from '@/lib/rag-implementation/setup-pinecone';

export async function POST() {
  try {
    const count = await upsertEmbeddings();
    return Response.json({ success: true, message: 'Embeddings upserted successfully', count });
  } catch (error) {
    console.error('Error upserting embeddings:', error);
    return Response.json(
      { error: 'Failed to upsert embeddings' },
      { status: 500 }
    );
  }
} 