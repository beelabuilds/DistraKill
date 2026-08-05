type AbortSignalConstructorWithStatics =
  typeof AbortSignal & {
    any?: (
      signals: readonly AbortSignal[],
    ) => AbortSignal;

    timeout?: (
      milliseconds: number,
    ) => AbortSignal;
  };

const AbortSignalConstructor =
  globalThis.AbortSignal as
    | AbortSignalConstructorWithStatics
    | undefined;

const AbortControllerConstructor =
  globalThis.AbortController;

if (
  AbortSignalConstructor &&
  AbortControllerConstructor
) {
  // React Native/Hermes may not provide AbortSignal.timeout().
  if (
    typeof AbortSignalConstructor.timeout !==
    'function'
  ) {
    Object.defineProperty(
      AbortSignalConstructor,
      'timeout',
      {
        configurable: true,
        writable: true,

        value: (
          milliseconds: number,
        ): AbortSignal => {
          const controller =
            new AbortControllerConstructor();

          const delay = Math.max(
            0,
            Number(milliseconds) || 0,
          );

          setTimeout(() => {
            if (!controller.signal.aborted) {
              controller.abort();
            }
          }, delay);

          return controller.signal;
        },
      },
    );
  }

  // React Native/Hermes may not provide AbortSignal.any().
  if (
    typeof AbortSignalConstructor.any !==
    'function'
  ) {
    Object.defineProperty(
      AbortSignalConstructor,
      'any',
      {
        configurable: true,
        writable: true,

        value: (
          signals: readonly AbortSignal[],
        ): AbortSignal => {
          const controller =
            new AbortControllerConstructor();

          const listeners: Array<{
            signal: AbortSignal;
            listener: () => void;
          }> = [];

          const removeListeners = () => {
            listeners.forEach(
              ({ signal, listener }) => {
                signal.removeEventListener(
                  'abort',
                  listener,
                );
              },
            );
          };

          const abortCombinedSignal = () => {
            if (!controller.signal.aborted) {
              controller.abort();
            }

            removeListeners();
          };

          for (const signal of signals) {
            if (signal.aborted) {
              abortCombinedSignal();
              break;
            }

            const listener = () => {
              abortCombinedSignal();
            };

            listeners.push({
              signal,
              listener,
            });

            signal.addEventListener(
              'abort',
              listener,
              { once: true },
            );
          }

          return controller.signal;
        },
      },
    );
  }
}
