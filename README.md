# JsBridge-native
javascript communicate with native application 

JSBridge的设计主要是为了解决web页与native交互的方案
1. 首先Bridge功能的javascript库文件分为两个：JSBridge.js 和 ClientApi.js，如图principle1.jpg

![principle1](https://user-images.githubusercontent.com/4135766/155916117-57f88816-ce18-455c-8af8-cdf5cd85d385.jpg)

图中的JSBridge.js文件主要是存放于native客户端的，native加载webview时会将JSBridge.js文件加到web页面中，其功能主要是与native进行交互，它是与业务无关的逻辑抽象，只提供ClientApi.js库底层调用（下面会详细展示它的功能）。
ClientApi.js文件是存放于web页面中，所提供的接口更容易被页面中的javascript功能模块操作去调用。它的所依赖或底层支撑的是上面提到JSBridge库（这个库与业务相关，不多作描述）

2. JSBridge.js库与native交互流程如图principle2.png
![principle2](https://user-images.githubusercontent.com/4135766/155916203-9566fad6-71c5-4cb5-be98-69e859cce9a4.png)
