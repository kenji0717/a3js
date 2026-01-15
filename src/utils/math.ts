
export function times2(x: number): number {
  return 2*x;
}

export function asyncSleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(()=>{resolve();},time);
  });
}

