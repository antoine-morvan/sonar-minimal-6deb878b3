export class MyApp {
  public static readonly MY_CONST = 666;

  public static doSmth(): void {
    // eslint-disable-next-line no-console
    console.log(MyApp.MY_CONST);
  }
}
