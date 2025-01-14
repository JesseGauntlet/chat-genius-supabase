# Implementation Notes

## Environment Setup
- Using `.env.local` for local development
- When using `dotenv`, specify the path: `require('dotenv').config({ path: '.env.local' })`

## Pinecone API Changes
- As of Pinecone SDK version 4.1.0, the `environment` parameter is no longer needed when initializing the client
- The initialization syntax has changed from:
  ```javascript
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "...",
    apiKey: "..."
  });
  ```
  to:
  ```javascript
  const pinecone = new Pinecone({
    apiKey: "..."
  });
  ```
- Reference: https://community.pinecone.io/t/environment-no-longer-shown-for-indexes/5306

## Environment Variables Required
- `OPENAI_API_KEY`: Your OpenAI API key
- `PINECONE_API_KEY`: Your Pinecone API key 

## Embedding Model
- Using OpenAI's `text-embedding-3-large` model
- Dimension size: 3072
- Reference: https://platform.openai.com/docs/guides/embeddings 