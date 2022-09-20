export class PriorityList<TObjectType> {
  objects: Record<number, TObjectType[]> = {};

  constructor() {
    this.objects = {};
  }

  static get DEFAULT_PRIORITY() {
    return 1;
  }

  add(priority = PriorityList.DEFAULT_PRIORITY, object: TObjectType) {
    this.objects[priority] = this.objects[priority] || [];
    this.objects[priority].push(object);
  }

  push(object :TObjectType) {
    this.add(PriorityList.DEFAULT_PRIORITY, object);
  }

  get(priority = PriorityList.DEFAULT_PRIORITY) {
    return Object.keys(this.objects)
      .map(Number)
      .sort((a, b) => b - a)
      .filter(k => k >= priority)
      .map(k => this.objects[k])
      .flat(1);
  }

  // map(...args) {
  //   let priority = PriorityList.DEFAULT_PRIORITY;
  //   const mapArgs = [...args];
  //   if (typeof args[0] === 'number') {
  //     [priority] = args;
  //     mapArgs.shift();
  //   }
  //   return this.get(priority).map(...mapArgs);
  // }
}
