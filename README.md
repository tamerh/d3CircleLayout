# d3CircleLayout

a layout on top of d3.pack layout to make circles visually more visible for some cases. Tested with d3 version 3.

#### Usage

After applying pack layout, apply circle layout like following
```javascript
(new d3CircleLayout(nodes)).apply();
```

Here is the visual difference between standard pack layout and circle layout.
 
![alt text](https://github.com/tamerh/d3CircleLayout/blob/master/img/pack.png "Pack Layout")

![alt text](https://github.com/tamerh/d3CircleLayout/blob/master/img/circle.png "Circle Layout")
