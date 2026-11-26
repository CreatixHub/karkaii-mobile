import type { Entity } from '@/core/store/store';
import type { FormValues } from './types';

export interface ResourceApi<T extends Entity> {
  list: () => Promise<T[]>;

  create: (values: FormValues) => Promise<T>;

  update: (
    id: string,
    values: FormValues
  ) => Promise<T>;

  remove?: (id: string) => Promise<void>;
}
