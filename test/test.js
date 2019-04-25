// function tt() {
//   var args = Array.prototype.slice.call(arguments);
//   console.log(args.map((i)=> {return JSON.stringify(i);}).join(' '));
// }

// tt(1,2,3,4, {a:1});
console.log(process.env);
let i = 0;
setInterval(() => {
  console.log(`log ${i} ${new Date()}`);
  console.error(`error ${i} ${new Date()}`);
}, 1000);
