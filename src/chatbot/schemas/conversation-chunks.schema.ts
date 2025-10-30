import { DataType, IndexType, MetricType } from '@zilliz/milvus2-sdk-node';

export const getConversationChunksSchema = (
  embeddingDim: number,
  collectionName: string,
) => ({
  collection_name: collectionName,
  fields: [
    {
      name: 'id',
      data_type: DataType.VarChar,
      is_primary_key: true,
      max_length: 100,
    },
    { name: 'organizationId', data_type: DataType.Int64 },
    { name: 'userId', data_type: DataType.Int64 },
    { name: 'sessionId', data_type: DataType.VarChar, max_length: 100 },
    { name: 'userMessage', data_type: DataType.VarChar, max_length: 5000 },
    { name: 'aiResponse', data_type: DataType.VarChar, max_length: 10000 },
    { name: 'normalizedText', data_type: DataType.VarChar, max_length: 15000 },
    { name: 'timestamp', data_type: DataType.Int64 },

    //Links to Postgres entities
    {
      name: 'relatedEventIds',
      data_type: DataType.Array,
      element_type: DataType.Int64,
      max_capacity: 50,
    },
    {
      name: 'relatedPersonIds',
      data_type: DataType.Array,
      element_type: DataType.Int64,
      max_capacity: 50,
    },
    {
      name: 'relatedCompanyIds',
      data_type: DataType.Array,
      element_type: DataType.Int64,
      max_capacity: 50,
    },

    // Entity extracted tracking
    {
      name: 'entityExtracted',
      data_type: DataType.Bool,
      nullable: true,
      default_value: false,
    },

    // Embeddings
    {
      name: 'questionEmbedding',
      data_type: DataType.FloatVector,
      dim: embeddingDim,
    },
    {
      name: 'answerEmbedding',
      data_type: DataType.FloatVector,
      dim: embeddingDim,
    },
  ],
  index: {
    index_type: IndexType.AUTOINDEX,
    metric_type: MetricType.COSINE,
  },
});
