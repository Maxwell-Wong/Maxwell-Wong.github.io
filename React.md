# ReactJS | Router

**Adding React Router Components:** The main Components of React Router are:

- **BrowserRouter:** BrowserRouter is a router implementation that uses the HTML5 history API(pushState, replaceState and the popstate event) to keep your UI in sync with the URL. It is the parent component that is used to store all of the other components.
- **Routes:** It’s a new component introduced in the v6 and a upgrade of the component. The main advantages of Routes over Switch are:Relative s and sRoutes are chosen based on the best match instead of being traversed in order.
- **Route:** Route is the conditionally shown component that renders some UI when its path matches the current URL.
- **Link:** Link component is used to create links to different routes and implement navigation around the application. It works like HTML [anchor tag](https://www.geeksforgeeks.org/html-a-tag/).







```react
<Routes>
	<Route exact path='/' element={< Home />}></Route>
	<Route exact path='/about' element={< About />}></Route>
	<Route exact path='/contact' element={< Contact />}></Route>
</Routes>
```

​	





### 箭头函数

**()=>this.tick()** 是 ES6 中声明函数的一种方式，叫做箭头函数表达式，引入箭头函数有两个方面的作用：更简短的函数并且不绑定 this。

```
var f = ([参数]) => 表达式（单一）
// 等价于以下写法
var f = function([参数]){
   return 表达式;
}
```

```
(参数1, 参数2, …, 参数N) => { 函数声明 }
(参数1, 参数2, …, 参数N) => 表达式（单一）
//相当于：(参数1, 参数2, …, 参数N) =>{ return 表达式; }

// 当只有一个参数时，圆括号是可选的：
(单一参数) => {函数声明}
单一参数 => {函数声明}

// 没有参数的函数应该写成一对圆括号。
() => {函数声明}
```





### React Props

state 和 props 主要的区别在于 **props** 是不可变的，而 state 可以根据与用户交互来改变。这就是为什么有些容器组件需要定义 state 来更新和修改数据。 而子组件只能通过 props 来传递数据。







### react 构造函数只有两个目的

- 初始化this.state
- 函数方法绑定到实例。

```text
constructor(props) {
  super(props);
  this.state = { counter: 0 }; //初始化state
  this.handleClick = this.handleClick.bind(this); // 事件绑定
}
```

类构造函数来初始化状态 this.state，类组件应始终使用 props 调用基础构造函数。

```react
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: new Date()};
  }
 
  render() {
    return (
      <div>
        <h1>Hello, world!</h1>
        <h2>现在是 {this.state.date.toLocaleTimeString()}.</h2>
      </div>
    );
  }
}
 
ReactDOM.render(
  <Clock />,
  document.getElementById('example')
);
```

