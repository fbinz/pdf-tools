class Command {
  constructor(inputs) {
    this.inputs = inputs;
  }

  apply() {
    return this.inputs;
  }
}


export class Nop extends Command {
}


export class Merge extends Command {
  apply() {
    const merged = ''
    for (const input of this.inputs) {

    }
  }
}
