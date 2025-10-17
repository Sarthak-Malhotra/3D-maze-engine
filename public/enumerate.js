//making enum in js
class enumerate {
  constructor(...data) {
    this.data = data;
    this.stack = {};
    this.init()
  }

  init() {
    for (let i = 0; i < this.data.length; i++) {
        this.stack[this.data[i]] = i + 1;
    }
  }

}

let dir = new enumerate("north","south","west","east");
console.log(dir.stack.north);

//.......................................................