/**
 * Created by levin on 14/12/16.
 * 在WebView中的页面引用此库
 */

;(function() {
    var clientApi = window.clientApi = {};
    /**
     * @desc 合并对象的属性
     * @param obj
     * @returns {*}
     * @private
     */
    var _extend = function(obj) {
        var type = typeof obj;
        if (! (type === 'function' || type === 'object' && !! obj)) {
            return obj;
        }
        var source, prop;
        for (var i = 0, l = arguments.length; i < l; i++) {
            source = arguments[i];
            for (prop in source) {
                if (hasOwnProperty.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    };

    /**
     * @desc 显示native工具条
     */
    clientApi.showToolBar = function() {
        JsBridge.invoke('showToolBar');
    };

    /**
     * @desc 隐藏native工具条
     */
    clientApi.hideToolBar = function() {
        JsBridge.invoke('hideToolBar');
    };

    /**
     * @desc 复制方法
     * @param str 所要复制的字符
     * @param next 回调
     */
    clientApi.copy = function(str, next) {
        if (!str || typeof str !== 'string') {
            return;
        }
        var data = {
            txt: str
        };
        JsBridge.invoke('copy', data, next);
    };

    /**
     * @desc 根据指定地址或当前地址，从浏览器打开
     * @param directUrl
     */
    clientApi.openBrowser = function(directUrl) {
        var data = {
            url: directUrl || window.location.href
        };
        JsBridge.invoke('openInBrowser', data);
    };

    /**
     * @desc 打开Debug模式，出现任何js错误都会显示
     * @param callback
     */
    clientApi.enableDebugMode = function(callback) {
        window.onerror = function(errorMessage, scriptURI, lineNumber, columnNumber) {
            // 有callback的情况下，将错误信息传递到options.callback中
            if (typeof callback === 'function') {
                callback({
                    message: errorMessage,
                    script: scriptURI,
                    line: lineNumber,
                    column: columnNumber
                });
                return;
            }
            // 其他情况，都以alert方式直接提示错误信息
            var msgs = [];
            msgs.push('额，代码有错。。。');
            msgs.push('\n错误信息：', errorMessage);
            msgs.push('\n出错文件：', scriptURI);
            msgs.push('\n出错位置：', lineNumber + '行，' + columnNumber + '列');
            alert(msgs.join(''));
        }
    };

    /**
     * @desc 开始下载操作
     * @param params
     *          gameId:游戏的Id;
     *          start:下载开始的方法;
     *          pause:下载暂停的方法;
     *          wait:下载数量过多时,需要等待的方法;
     *          downloading:正在下载方法,native每次通知下载进度会调用它;
     *          downloadComplete:下载完成方法,当每个游戏下载完成时会执行它;
     *          installComplete:安装完成方法,当下载的游戏安装完成时会执行它;
     *          channel:渠道号，用于分渠道下载;
     * @param next 开始下载操作通知native后,要扫行的回调方法
     * @param ctx 回调方法里的上下文
     */
    clientApi.download = function(params, next, ctx) {
        JsBridge.pushItemInDLMap({
                id: params.gameId,
                start: params.start,
                pause: params.pause,
                wait: params.wait,
                downloading: params.downloading,
                downloadComplete: params.downloadComplete,
                installComplete: params.installComplete,
                remove: params.remove,
                fail: params.fail,
                ctx: params.ctx,
                channel:params.channel
            },
            function() {
                JsBridge.invoke('download_start', {
                        id: params.gameId,
                        packageName: params.packageName,
                        channel:params.channel
                    },
                    next, ctx);
            });
    };
    /**
     * @desc 添加到下载对列里
     * @param params
     * @param next
     * @param ctx
     */
    clientApi.pushItemInDownLoadMap = function(params, next, ctx) {
        JsBridge.pushItemInDLMap({
                id: params.gameId,
                start: params.start,
                pause: params.pause,
                wait: params.wait,
                downloading: params.downloading,
                downloadComplete: params.downloadComplete,
                installComplete: params.installComplete,
                remove: params.remove,
                fail: params.fail,
                ctx: params.ctx,
                channel:params.channel
            },
            next, ctx);
    };


    /**
     * @desc 用户对下载的游戏进行暂停操作
     * @param params gameId:游戏Id
     * @param params channel:渠道号，用于分渠道下载;
     * @param next native执行完暂停操作所要调用的回调方法
     * @param ctx 回调方法里的上下文
     */
    clientApi.downloadPause = function(params, next, ctx) {
        JsBridge.invoke('download_pause', {
                id: params.gameId,
                channel:params.channel
            },
            function(param) {
                next && next.call(ctx);
            },
            ctx);
    };


    /**
     * @desc 用户对已下载但暂停的游戏进行继续下载操作
     * @param params gameId:游戏Id
     * @param params channel:渠道号，用于分渠道下载;
     * @param next native执行完继续下载操作所要调用的回调方法
     * @param ctx 回调方法里的上下文
     */

    clientApi.downloadContinue = function(params, next, ctx) {
        JsBridge.invoke('download_continue', {
                id: params.gameId,
                channel:params.channel
            },
            function(param) {
                next && next.call(ctx);
            },
            ctx);
    };


    /**
     * @desc 用户对已下载完成的游戏进行安装操作
     * @param params gameId:游戏Id
     * @param params channel:渠道号，用于分渠道下载;
     * @param next native执行完安装操作所要调用的回调方法
     * @param ctx 回调方法里的上下文
     */
    clientApi.downloadInstall = function(params, next, ctx) {
        JsBridge.invoke('download_install', {
                id: params.gameId,
                channel:params.channel
            },
            function(param) {
                JsBridge.shiftItemFrDLMap(params.gameId);
                next && next.call(ctx);
            },
            ctx);
    };

    /**
     * @desc 用户打开游戏操作
     * @param params gameId:游戏Id;
     *               packageName:游戏包名;
     * @param params channel:渠道号，用于分渠道下载;
     * @param next native执行完打开游戏操作所要调用的回调方法
     * @param ctx 回调方法里的上下文
     */
    clientApi.openGame = function(params, next, ctx) {
        JsBridge.invoke('open_game', {
                id: params.gameId,
                packageName: params.packageName,
                channel:params.channel
            },
            function(param) {},
            ctx);
    };

    /**
     * @desc 根据native数据初始化web页面(此方法目前只限于游戏下载列表页面初始化状态)
     * @param params
     * @param next
     * @param ctx
     */
    clientApi.initPageByNativeData = function(params, next, ctx) {
        JsBridge.invoke('init_web', {
                gameList: params.gameList
            },
            function(param) {
                next && next.call(ctx, param);
            },
            ctx);
    };

    /**
     * @desc 根据native数据初始化web页面
     * @param type 需要什么类型的初始化数据
     *              目前包含：
     *              resForCreateTradeUnion ：初始化公会创建结果状态
     * @param params 需求请求数据的参数
     * @param next 回调方法
     * @param ctx 上下文
     */
    clientApi.initPageByClientData = function(type,params,next,ctx){
        JsBridge.invoke('init_web_by_type',{
                type : type,
                param : params
            },function(res){
                next && next.call(ctx,res);
            },
            ctx);

    };

    /**
     * @desc 分享图片
     * @param cb
     */
    var getSharePreviewImage = function(cb) {
        var isCalled = false;
        var callCb = function(_img) {
            if (isCalled) {
                return;
            }
            isCalled = true;
            cb(_img);
        };

        var _imgs = document.getElementsByTagName('img');
        if (!_imgs.length) {
            return callCb();
        }
        // 过滤掉重复的图片
        var _srcs = {},
            _img, i, len, _newImg, _isFind = false;
        for (i = 0, len = _imgs.length; i < len; i++) {
            _img = _imgs[i];
            // 过滤掉不可以见的图||
            if (_img.style['display'] == 'none' || _img.style['visibility'] == 'hidden') {
                continue;
            }
            if (_srcs[_img.src]) {
                continue;
            }
            _srcs[_img.src] = 1;
            _newImg = new Image();
            _newImg.onload = function() {
                if (_isFind) {
                    return;
                }
                if (this.width > 290 && this.height > 290) {
                    _isFind = true;
                    callCb(this);
                }
            };
            _newImg.src = _img.src;
        }
        _srcs = null;
        //超过1分钟如果没有找到，那么直接调用callback
        setTimeout(function() {
                if (!_isFind) {
                    callCb();
                }
            },
            1000);
    };

    /**
     * @desc 调用native播放器来播放指定视频
     * @param add:视频地址 titles：视频标题
     * @param cb
     */
    clientApi.videoPlay = function(add,titles, cb) {
        JsBridge.invoke('video_play', {
                url: add,
                title:titles
            },
            cb);
    };

    /**
     * @desc 显示Web页自定义事件
     * @param cb
     */
    clientApi.showMenu = function(cb) {
        JsBridge.on('menu:show', function(argv) {
            cb && cb(argv);
        });

    };

    /**
     * @desc 分享接口
     * @param imgUrl 图片地址
     * @param link 页面链接
     * @param title 标题
     * @param desc 内容
     */
    clientApi.share = function(param) {
        var data;
        if (typeof param.title === 'string') {
            data = param;
        }else{
            data = {
                "link": document.documentURI,
                "desc": document.documentURI,
                "title": document.title
            };
        }
        if(param.imgUrl){
            data['img_url'] = param.imgUrl;
            JsBridge.invoke('share',data);
            return;
        }
        var shareFunc = function(_img){
            if (_img) {
                data['img_url'] = _img.src;
            }
            JsBridge.invoke('share',data);
        };
        getSharePreviewImage(shareFunc);
    };

    /**
     * @desc 打开native输入界面输入内容
     * @param txt
     * @param cb
     */
    clientApi.inputTxtByNative = function(txt, cb) {
        JsBridge.invoke('submit_input_txt', {
                content: txt
            },
            cb);
    };
    /**
     * @desc 触发native发送请求
     * @param data
     *        url:请求地址
     *        param:请求参数
     *        http_method:请求方式，目前分为get、post方式
     *        secertKey:如果要使用AES加密方式，此参数为加密的key
     *        type:属性哪一类的请求；目前分为4类：‘point’：积分接口分类 ；‘gift’：商品接口分类；‘ticket’：游戏礼券接口分类；‘promotion’：游戏活动接口；'v3':v3加密方式
     * @param cb
     */
    clientApi.nativeRequest = function(data, cb) {
        if (data.url === '' || data.type === '') {
            return;
        }
        var opt = {
            url: data.url,
            param: data.param || {},
            http_method:data.http_method || 'get',
            secertKey: data.secertKey || '',
            type: data.type
        };
        JsBridge.invoke('native_request', opt, cb);
    };

    /**
     * @desc JS调用native的对话框
     * @param conf
     * @param cbs
     */
    clientApi.showDialog = function(conf, cbs) {
        //默认设置
        var _conf = {
            //dialog的类型包括："show:txt"：只显示信息，会显示一个关闭按钮或者不显示关闭按钮根据设置时间延迟自动关闭。"submit:input" || "submit:select":提供给用户可以选择或输入的对话框，会显示值为ok的btn或者是cancel的btn
            type: 'show:txt',
            title: '',
            content: '',
            //是否要延迟关闭，不使用关闭按钮，希望通过间隔时间自动关闭，可将些属性设为true。
            isLazyClose: false,
            //延迟时间
            lazyTime: 0,
            //是否显示cancel按钮
            isShowCancelBtn: false,
            //cancel按钮的文本
            cancelBtnTxt: '取消',
            //是否显示ok按钮
            isShowOkBtn: false,
            //ok按钮的文本
            okBtnTxt: '确定'
        };
        var _cb = function(resp) {
            if (!resp || (!resp.operat)) {
                return;
            }
            switch (resp.operat) {
                case 'ok':
                    cbs.ok && cbs.ok(resp.content);
                    break;
                case 'cancel':
                    cbs.cancel && cbs.cancel(resp.content);
                    break;
                default:
                    break;
            }
        };
        _conf = _extend(_conf, conf);

        if (_conf.type == 'submit') {
            _conf.isLazyClose = false;
        }
        JsBridge.invoke('show_dialog', _conf, _cb);
    };
    /**
     * @desc 阻止向左滑动返回上一个界面
     * @param _conf
     * @param _cb
     */
    clientApi.preventSwipeBack = function(_conf, _cb) {
        _conf = _conf || {
                prevent: true
            };
        _cb = _cb || function() {};
        JsBridge.invoke('prevent_swipe_back', _conf, _cb);
    };
    /**
     * @desc 通知客户端进行上传图片
     * @param _cb 回调方法
     *          _param 回调方法里的参数:
     *           status:-1:失败，0:成功
     *           url:图片地址
     */
    clientApi.uploadImg = function(_cb){
        JsBridge.invoke('upload_img',{},_cb);
    };

    /**
     * @desc 调试时需要在客户端打印日志
     * @param _info
     */
    clientApi.clientLog = function(_info){
        JsBridge.invoke('client_log',{info:_info});
    };
    /**
     * @desc 页面权限失效或未登录需要重新恢复权限或重新登录功能（仅供transference page调用）
     * @param type 需要重置类型：1、service token 失效，需要客户端重置token；2、未登录，或session失效，需要客户端调用登录界面。
     * @param tagUrl 重置成功后需要跳转的页面地址
     */
    clientApi.reinstate = function(type,tagUrl){
        type *= 1;
        switch(type){
            case 1:
                JsBridge.invoke('service_token_invalidate',{tagurl:tagUrl});
                break;
            case 2:
                JsBridge.invoke('login_invalidate',{tagurl:tagUrl});
                break;
            default:
                break;
        }
    };

    /**
     * @desc 通知客户端当前页不需要在历史记录中记录，从它跳转出去的页面，点返回按钮不会再回到这个页面，到它的上一级页面
     * @param _cb
     */
    clientApi.historyNotRecords = function(_cb){
        JsBridge.invoke('history_not_records',{},_cb);
    };

    /**
     * @desc 通知客户端当前页点返回按钮直接跳出webview回到客户端界面
     * @param _cb
     */
    clientApi.historyJumpOutWebview = function(_cb){
        JsBridge.invoke('history_jumpout_webview',{},_cb);
    };
    /**
     * @desc 当Web页中有后退功能，调用客户端后退功能
     * @param _cb
     */
    clientApi.goBack = function(_cb){
        JsBridge.invoke('web_go_back',{},_cb);
    };
    /**
     * @desc 查看游戏截图详情
     * @param _conf 包含两个参数：
     *             screenShot: [
     {
         action: "AppStore/1d13fb6b-973e-42be-a052-5a00b8e68620",
         url: "AppStore/1d13fb6b-973e-42be-a052-5a00b8e68620",
         screenType: 1
     }
     ]
     curIndex:当前看的第几张图
     *
     * @param _cb
     */
    clientApi.viewImgList = function(_conf,_cb){
        var data = {
            screenShot:_conf.screenShot || [],
            curIndex:_conf.curIndex || 0
        };
        if(!data.screenShot.length){
            return;
        }
        JsBridge.invoke('view_img_list',data,_cb);
    };

    /**
     * @desc 根据类型从客户端拉取数据
     * @param _type 类型值包含以下几种
     *          base:基础信息；
     * @param _cb
     */
    clientApi.getBaseDataFromClient = function(_type,_cb){
        var data = {
            type:_type
        };
        JsBridge.invoke('get_basedata_by_type',data,_cb);
    };

    /**
     * @desc 通知客户端隐藏loading状态
     */

    clientApi.notifyLoadingOver = function(_cb){
        JsBridge.invoke('client_loading_over',{},_cb);
    };

    /**
     * @desc 获取所有会话数据，包含基础数据userInfo,env
     * @returns {*}
     */
    clientApi.getSessionData = function(){
        return JsBridge.getSessionData();
    };

    /**
     * @desc 获取评论的对话输入框（目前仅支持资讯页调用）
     * @param id 资讯ID
     *           _cb 回调函数 返回值：{status:状态值} -1：失败 0：成功
     */
    clientApi.commentTxtByNative = function(id,_cb){
        var data = {
            news_id:id
        };
        JsBridge.invoke('client_comment_txt',data,_cb);
    };

    /**
     * @desc h5游戏登陆
     * @param opt {object} opt.appId 应用id,opt.appKey 应用key
     *           _cb 回调函数 返回值：{result:状态值,uid:'',session:''} result:0：成功,其他：失败 
     */
    clientApi.h5GameLogin= function(opt,_cb){
        if(!opt){
            _cb&&_cb({result:-100,errorMessage:'options is null'});
            return;
        }
        if(!opt.appId){
            _cb&&_cb({result:-101,errorMessage:'appId is null'});
            return;
        }
        if(!opt.appKey){
            _cb&&_cb({result:-102,errorMessage:'appKey is null'});
            return;
        }
        //var data = {
        //    appId:opt.appId,
        //    appKey:opt.appKey
        //};
        JsBridge.invoke('h5_game_login',opt,_cb);
    };

    /**
     * @desc h5游戏支付
     * @param opt {object} opt.cporderId 游戏订单id ,opt.cpUserInfo 游戏用户信息,opt.amount 游戏付费价格，单位：分,opt.productCode 计费代码，例如：com.xiaomi.gamecenter.demo.h5game.produc。（amount和productCode二者只需要其中之一）,opt.count 购买的数量，和opt.productCode配合使用。
     *           _cb 回调函数 返回值：{result:状态值,errorMessage:''},其中result:0：成功, 其他：失败 
     */
    clientApi.h5GamePay= function(opt,_cb){
        if(!opt){
            _cb&&_cb({result:-103,errorMessage:'options is null'});
            return;
        }
        if(!opt.cpOrderId){
            _cb&&_cb({result:-104,errorMessage:'cpOrderId is null'});
        }
        if(!opt.cpUserInfo){
            _cb&&_cb({result:-105,errorMessage:'cpUserInfo is null'});
        }
        //var data = {
        //    cpOrderId:cpOrderId,
        //    cpUserInfo:cpUserInfo,
        //    amount:amount
        //};
        JsBridge.invoke('h5_game_pay',opt,_cb);
    };

})();

