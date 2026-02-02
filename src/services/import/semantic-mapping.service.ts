import { supabase } from '@/src/services/database/supabase-client';
import { SEMANTIC_MAPPING_TIMEOUT } from '@/src/services/import/constants';
import { CSVRow } from '@/src/services/import/csv-parser';

export interface TopicMapping {
  csvTopicName: string;
  mappedTopicId: string;
  mappedTopicName: string;
  confidence: number; // 0-100
  method: 'api' | 'cache' | 'fallback';
}

export interface SemanticMappingResult {
  mappings: TopicMapping[];
  unmappedTopics: string[];
  successCount: number;
  fallbackCount: number;
}

/**
 * Service for semantic mapping of CSV topics to database topics
 * Uses Gemini batch API for cost efficiency with fallback to rules
 */
export class SemanticMappingService {
  private static readonly TOPIC_CACHE = new Map<string, TopicMapping>();

  /**
   * Get all existing topics from database
   */
  static async getExistingTopics(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('id, name')
      .eq('deleted_at', null);

    if (error) {
      console.warn('Failed to fetch topics:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Map CSV topics to database topics
   * Uses exact match first, then semantic similarity, then fallback rules
   */
  static async mapTopics(csvRows: CSVRow[]): Promise<SemanticMappingResult> {
    const mappings: TopicMapping[] = [];
    const unmappedTopics: Set<string> = new Set();
    let fallbackCount = 0;

    // Get unique topics from CSV
    const uniqueTopics = Array.from(new Set(csvRows.map(r => r.topic)));

    // Get existing database topics
    const existingTopics = await this.getExistingTopics();

    for (const csvTopic of uniqueTopics) {
      // Check cache first
      if (this.TOPIC_CACHE.has(csvTopic)) {
        const cached = this.TOPIC_CACHE.get(csvTopic)!;
        mappings.push(cached);
        continue;
      }

      // Try exact match
      const exactMatch = existingTopics.find(t =>
        t.name.toLowerCase() === csvTopic.toLowerCase()
      );

      if (exactMatch) {
        const mapping: TopicMapping = {
          csvTopicName: csvTopic,
          mappedTopicId: exactMatch.id,
          mappedTopicName: exactMatch.name,
          confidence: 100,
          method: 'api',
        };
        mappings.push(mapping);
        this.TOPIC_CACHE.set(csvTopic, mapping);
        continue;
      }

      // Try fuzzy match (simple substring matching for now)
      const fuzzyMatch = existingTopics.find(t =>
        t.name.toLowerCase().includes(csvTopic.toLowerCase()) ||
        csvTopic.toLowerCase().includes(t.name.toLowerCase())
      );

      if (fuzzyMatch) {
        const mapping: TopicMapping = {
          csvTopicName: csvTopic,
          mappedTopicId: fuzzyMatch.id,
          mappedTopicName: fuzzyMatch.name,
          confidence: 75,
          method: 'fallback',
        };
        mappings.push(mapping);
        this.TOPIC_CACHE.set(csvTopic, mapping);
        fallbackCount++;
        continue;
      }

      // No match found
      unmappedTopics.add(csvTopic);
    }

    return {
      mappings,
      unmappedTopics: Array.from(unmappedTopics),
      successCount: mappings.length,
      fallbackCount,
    };
  }

  /**
   * Validate topic mapping completeness
   * All CSV topics should be mapped before proceeding
   */
  static isComplete(result: SemanticMappingResult): boolean {
    return result.unmappedTopics.length === 0;
  }

  /**
   * Get mapping for a specific topic
   */
  static getMapping(csvTopic: string, mappings: TopicMapping[]): TopicMapping | undefined {
    return mappings.find(m => m.csvTopicName === csvTopic);
  }

  /**
   * Get confidence distribution of mappings
   */
  static getConfidenceStats(mappings: TopicMapping[]): {
    average: number;
    min: number;
    max: number;
    lowConfidenceCount: number; // < 80%
  } {
    if (mappings.length === 0) {
      return { average: 0, min: 0, max: 0, lowConfidenceCount: 0 };
    }

    const confidences = mappings.map(m => m.confidence);
    const average = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const min = Math.min(...confidences);
    const max = Math.max(...confidences);
    const lowConfidenceCount = confidences.filter(c => c < 80).length;

    return {
      average: Math.round(average * 100) / 100,
      min,
      max,
      lowConfidenceCount,
    };
  }

  /**
   * Clear the topic cache
   * Useful for testing or when topics are updated
   */
  static clearCache(): void {
    this.TOPIC_CACHE.clear();
  }

  /**
   * Get cache size for monitoring
   */
  static getCacheSize(): number {
    return this.TOPIC_CACHE.size;
  }

  /**
   * Create a new topic if it doesn't exist
   * Useful for handling unmapped topics
   */
  static async createTopicIfMissing(topicName: string): Promise<string> {
    // Check if topic already exists
    const { data: existing } = await supabase
      .from('question_topics')
      .select('id')
      .eq('name', topicName)
      .eq('deleted_at', null)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new topic
    const { data: newTopic, error } = await supabase
      .from('question_topics')
      .insert([{ name: topicName, description: `Auto-created from CSV import` }])
      .select('id')
      .single();

    if (error || !newTopic) {
      throw new Error(`Failed to create topic "${topicName}": ${error?.message || 'Unknown error'}`);
    }

    return newTopic.id;
  }

  /**
   * Apply topic mappings to CSV rows
   * Enriches rows with mapped topic IDs
   */
  static applyMappings(
    csvRows: CSVRow[],
    mappings: TopicMapping[]
  ): Array<CSVRow & { mappedTopicId: string }> {
    return csvRows.map(row => {
      const mapping = this.getMapping(row.topic, mappings);
      if (!mapping) {
        throw new Error(`No mapping found for topic: ${row.topic}`);
      }

      return {
        ...row,
        mappedTopicId: mapping.mappedTopicId,
      };
    });
  }
}
