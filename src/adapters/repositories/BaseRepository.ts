import {
  TransactWriteCommand,
  TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDBDocumentClient } from "@/infrastructure/database/dynamodb";

/**
 * Base repository providing shared DynamoDB utilities, 
 * specifically focusing on robust transaction handling and key casing (id vs Id).
 */
export abstract class BaseRepository {
  /**
   * Executes a transaction with automatic retry logic for key schema mismatches (id vs Id).
   * This is useful when different tables in the transaction use different casing for partition keys.
   */
  protected async executeTransactionWithRetry(
    transactItems: NonNullable<TransactWriteCommandInput["TransactItems"]>
  ): Promise<void> {
    try {
      await dynamoDBDocumentClient.send(
        new TransactWriteCommand({ TransactItems: transactItems })
      );
    } catch (error: any) {
      const reasons = error.CancellationReasons || [];
      const isValidationException = error.name === "ValidationException" || 
                                   error.message?.includes("The provided key element does not match the schema");
      
      const hasKeyErrorInReasons = reasons.some(
        (r: any) => 
          r.Code === "ValidationError" || 
          (r.Message && r.Message.includes("The provided key element does not match the schema"))
      );

      if (isValidationException || hasKeyErrorInReasons) {
        console.warn(`[${this.constructor.name}] Transaction key mismatch detected. Attempting granular fallback...`);
        
        const fallbackItems = transactItems.map((item, index) => {
          const reason = reasons[index];
          
          if (isValidationException || reason?.Code === "ValidationError") {
            const opType = Object.keys(item)[0] as keyof typeof item;
            const op = (item as any)[opType];
            
            if (op && op.Key) {
              const newKey = this.swapKeyCasing(op.Key);
              return {
                [opType]: {
                  ...op,
                  Key: newKey
                }
              };
            }
          }
          return item;
        });

        try {
          await dynamoDBDocumentClient.send(
            new TransactWriteCommand({ TransactItems: fallbackItems })
          );
          return; // Success on retry
        } catch (retryError: any) {
          console.error(`[${this.constructor.name}] Fallback transaction failed:`, retryError);
          throw retryError;
        }
      }

      if (error.name === "TransactionCanceledException") {
        console.error(
          `[${this.constructor.name}] Transaction cancelled for reasons other than key mismatch:`,
          JSON.stringify(reasons, null, 2)
        );
      }
      throw error;
    }
  }

  protected swapKeyCasing(key: Record<string, any>): Record<string, any> {
    const newKey = { ...key };
    if (newKey.id !== undefined) {
      newKey.Id = newKey.id;
      delete newKey.id;
    } else if (newKey.Id !== undefined) {
      newKey.id = newKey.Id;
      delete newKey.Id;
    }
    return newKey;
  }

  protected prepareItem(item: Record<string, any>): Record<string, any> {
    const result = { ...item };
    const idValue = item.id || item.Id;
    if (idValue) {
      result.id = idValue;
      result.Id = idValue;
    }
    
    for (const key in result) {
      if (result[key] instanceof Date) {
        result[key] = result[key].toISOString();
      }
    }
    
    return result;
  }


  protected getExistenceCondition(): string {
    return "attribute_exists(id) OR attribute_exists(Id)";
  }
}