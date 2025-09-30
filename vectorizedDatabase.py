import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec
import os
from typing import List, Dict
from dotenv import load_dotenv
import time

class PineconeVectorizedDatabase:
    def __init__(self):
        load_dotenv()
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.pinecone_api_key = os.getenv('PINECONE_API_KEY')
        self.pinecone_environment = os.getenv('PINECONE_ENVIRONMENT')
        self.pinecone_index_name=os.getenv('PINECONE_INDEX_NAME')

        if self.pinecone_api_key and self.pinecone_environment and self.pinecone_index_name:
            self.pc=Pinecone(api_key=self.pinecone_api_key, environment=self.pinecone_environment)
            
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
        else:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")


    def generate_embedding(self, text: str) -> List[float]:
        """
        Create vectorized representation of the input text using Gemini embeddings.

        Arguments:
        text: The input text to be vectorized.

        Returns:
        A list of floats representing the embedding vector.
        """
        result = genai.embed_content(
            model='models/text-embedding-004',
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    

    def initialize_index(self)->Pinecone.Index:
        """
        Initialize the Pinecone index connection. Create it if it doesn't exist.

        Arguments:
        None

        Returns:
        The Pinecone index object.
        """
        try:
            index=self.pc.create_index(
                name=self.pinecone_index_name,
                dimension=768,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws",
                    region="us-east-1")
            )
            print(f"Created index: {self.pinecone_index_name}")
        except Exception as E:
            print(f"Index {self.pinecone_index_name} already exists ... {E}")
        finally:
            # Connect to index if already existant or after creation
            index = self.pc.Index(self.pinecone_index_name)
            print(f"Connected to index: {self.pinecone_index_name}")
            print(f"Index stats: {index.describe_index_stats()}")
            return index


    
    def upsert_embedding(self, namespace: int, embedding: List[float], messageID:int,creationDate: str, query:str, day:int) -> None:
        """
        Upsert a single embedding vector into the Pinecone index.

        Arguments:
        namespace: The partition to store the embedding.
        embedding: The embedding vector to upsert.
        messageID: Unique identifier for the message imported directly from the chat history SQL table.
        creationDate: The creation date of the message.

        returns:
        None
        """
        try:
            index = self.initialize_index()
            index.upsert( #Here id refers to the messageID in the chat_history table, however, id key is required for pinecone
                vectors=[{'id':str(messageID),'values': embedding, 'metadata': {'creationDate': creationDate, "query":query, "day":str(day)}}],
                namespace=str(namespace)
            )
            print(f"Upserted embedding for namespace {namespace}")
            # Wait for indexing
            time.sleep(2)
            #print(f"Updated index stats: {index.describe_index_stats()}")
        except Exception as e:
            print(f"Error upserting embedding: {e}")


    def semantic_search(self,query: str,  namespace:int, day: int, top_k: int = 10) -> List[Dict]:
        """
        Perform semantic search using Pinecone

        Arguments:
        query: The search query string.
        namespace: The partition to search within.
        top_k (three by default): The number of top results to return.

        returns:
        A list of dictionaries containing the top_k search results with their metadata.
        """
        # Generate query embedding and initialize index
        query_embedding = self.generate_embedding(query)
        index = self.initialize_index()
        results=[]
        # Search the query in Pinecone
        try:
            results = index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                namespace= str(namespace), 
                filter={
                    "day": {'$eq': str(day)},
                }
            )
        except Exception as e:
            print(f"Error during search: {e}")
            results=[]
        finally:

            #  Sort by message id to get chronological order
            sorted_matches = sorted(results["matches"], key=lambda x: int(x["id"]))

            # Eliminate last 3 as they will be obtained through SQL
            trimmed_matches = sorted_matches[:-3] if len(sorted_matches) > 3 else []

            # Only show results with a score of 0.75 or higher
            filtered_matches = [m for m in trimmed_matches if m["score"] >= 0.75]

            results["matches"] = filtered_matches
            print(results)
            print(type(results))
        return results
