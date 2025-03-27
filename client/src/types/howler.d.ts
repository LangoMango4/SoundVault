declare module 'howler' {
  export class Howl {
    constructor(options: any);
    play(): number;
    stop(id?: number): this;
    seek(position?: number): number | this;
    duration(): number;
    unload(): this;
  }

  export class Howler {
    static stop(): void;
  }
}