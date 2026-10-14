import { ref, watchEffect, onUnmounted, type Ref } from 'vue';
import { liveQuery, type Subscription } from 'dexie';

/**
 * Vue 3 Composable to bind a Dexie liveQuery to a reactive ref.
 * Automatically resubscribes if reactive dependencies inside `querier` change,
 * and cleanly unsubscribes on unmount.
 */
export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  defaultValue: T
): Ref<T> {
  const result = ref<T>(defaultValue) as Ref<T>;
  let subscription: Subscription | null = null;

  watchEffect((onCleanup) => {
    // Unsubscribe previous subscription if dependencies change
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    try {
      const observable = liveQuery(querier);
      subscription = observable.subscribe({
        next: (value) => {
          result.value = value;
        },
        error: (err) => {
          console.error('Dexie liveQuery error:', err);
        }
      });
    } catch (err) {
      console.error('Failed to create Dexie liveQuery:', err);
    }

    onCleanup(() => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    });
  });

  onUnmounted(() => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  });

  return result;
}
