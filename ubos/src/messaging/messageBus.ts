import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { BusTopic, TaskMessage, ResultMessage } from '../protocols/messageTypes.js';
import { TaskMessageSchema, ResultMessageSchema, MessageHeaderSchema } from '../protocols/messageTypes.js';

type Handler<T> = (msg: T) => void | Promise<void>;

export class MessageBus {
  private ee = new EventEmitter();

  publish<T extends object>(topic: BusTopic, message: T): void {
    this.ee.emit(topic, message);
  }

  subscribe<T extends object>(topic: BusTopic, handler: Handler<T>): () => void {
    const bound = (msg: T) => handler(msg);
    this.ee.on(topic, bound);
    return () => this.ee.off(topic, bound);
  }

  async request<RequestT extends object, ResponseT extends object>(
    topic: BusTopic,
    request: RequestT,
    opts: { timeoutMs?: number } = {}
  ): Promise<ResponseT> {
    const correlationId = randomUUID();
    const replyTopic = `__reply/${correlationId}`;

    const timeoutMs = opts.timeoutMs ?? 15000;
    return await new Promise<ResponseT>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.ee.off(replyTopic, onReply);
      };

      const onReply = (msg: ResponseT) => {
        cleanup();
        resolve(msg);
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`MessageBus request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.ee.on(replyTopic, onReply);

      const header = { ...((request as { header?: unknown }).header || {}), correlationId };
      const payload = { ...(request as object), header };
      this.publish(topic, payload as unknown as RequestT);
    });
  }

  reply<ResponseT extends object>(correlationId: string | undefined, response: ResponseT): void {
    if (!correlationId) return;
    const topic = `__reply/${correlationId}`;
    this.publish(topic, response);
  }

  // Helpers validating standard EUFM messages
  publishTask(topic: BusTopic, msg: TaskMessage): void {
    TaskMessageSchema.parse(msg);
    this.publish(topic, msg);
  }

  publishResult(topic: BusTopic, msg: ResultMessage): void {
    ResultMessageSchema.parse(msg);
    this.publish(topic, msg);
  }

  isHeader(obj: unknown): obj is { header?: unknown } {
    if (!obj || typeof obj !== 'object') return false;
    const maybe = obj as { header?: unknown };
    if (!maybe.header) return false;
    try {
      MessageHeaderSchema.parse(maybe.header);
      return true;
    } catch {
      return false;
    }
  }
}
