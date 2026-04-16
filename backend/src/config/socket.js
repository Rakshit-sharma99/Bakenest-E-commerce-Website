let ioInstance;

export const initSocket = (io) => {
  ioInstance = io;
};

export const getSocket = () => ioInstance;

export const emitRealtimeUpdate = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
};
