// @flow

let asyncActionsSingleton: Array<() => Promise<*>> = [];
export function executeStepAndCollectAsyncActions(
  stepActionThatMayCallDoAsync: () => any
): Array<() => Promise<*>> {
  asyncActionsSingleton = [];
  const collectedAsyncActions = [];

  try {
    stepActionThatMayCallDoAsync();
  } finally {
    collectedAsyncActions.push(...asyncActionsSingleton);
    asyncActionsSingleton = [];
  }

  return collectedAsyncActions;
}

export function doAsync(action: () => Promise<*>) {
  asyncActionsSingleton.push(action);
}
