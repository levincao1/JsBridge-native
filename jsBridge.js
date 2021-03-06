/**
 * Created by levin on 14/12/16.
 * 在WebView中的页面引用此库
 */

;(function(global) {
    'use strict';
    // existing version for noConflict()
    var _Base64 = global.Base64;
    var version = "2.1.5";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
            ord = ccc.charCodeAt(0) << 16
                | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
                | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
            chars = [
                b64chars.charAt( ord >>> 18),
                b64chars.charAt((ord >>> 12) & 63),
                    padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
                    padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
            ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
            ? function (u) { return (new buffer(u)).toString('base64') }
            : function (u) { return btoa(utob(u)) }
        ;
    var encode = function(u, urisafe) {
        return !urisafe
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function(m0) {
            return m0 == '+' ? '-' : '_';
        }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
            case 4:
                var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                        |    ((0x3f & cccc.charCodeAt(1)) << 12)
                        |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                        |     (0x3f & cccc.charCodeAt(3)),
                    offset = cp - 0x10000;
                return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
            case 3:
                return fromCharCode(
                        ((0x0f & cccc.charCodeAt(0)) << 12)
                        | ((0x3f & cccc.charCodeAt(1)) << 6)
                        |  (0x3f & cccc.charCodeAt(2))
                );
            default:
                return  fromCharCode(
                        ((0x1f & cccc.charCodeAt(0)) << 6)
                        |  (0x3f & cccc.charCodeAt(1))
                );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
            padlen = len % 4,
            n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
                | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
                | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
                | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
            chars = [
                fromCharCode( n >>> 16),
                fromCharCode((n >>>  8) & 0xff),
                fromCharCode( n         & 0xff)
            ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
        ? function(a) { return (new buffer(a, 'base64')).toString() }
        : function(a) { return btou(atob(a)) };
    var decode = function(a){
        return _decode(
            a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    // that's it!
})(this);

if (this['Meteor']) {
    Base64 = global.Base64; // for normal export in Meteor.js
}

/**
 * @instance JsBridge
 * @author levin
 * JsBridge库功能：定义了WebView页面中的JS与native客户端进行交互的协议、及常用事件等。
 */

;(function(){
    "use strict";
    //发送消息的iframe
    var _readyMsgIframe,
    //消息对列用于存JS操作指令供native获取
        _sendMsgQueue = [],
    //回调方法的key的起始值
        _callbackCount = 1000,
    //回调方法集合
        _callbackMap = {},
    //事件句柄集合
        _eventHookMap = {},
    //下载资源集合
        _downloadMap = {},
    //会话数据
        _sessionData = {};
    //协议头
    var _CUSTOM_PROTOCOL_SCHEME = 'migamecenter',
    //消息类型
        _MESSAGE_TYPE = '__msg_type',
    //回调方法ID
        _CALLBACK_ID = '__callback_id',
    //事件句柄ID
        _EVENT_ID = '__event_id',
    //消息通知协议
        _QUEUE_HAS_MESSAGE = 'dispatch_message/',
    //执行回调发送回调结果的iframe
        _setResultIframe;

    /**
     * @description 在页面添加返回结果iframe和消息准备队列
     * @returns {HTMLElement}
     * @private
     */
    var _createQueueReadyIframe = function(){
        _setResultIframe = document.createElement('iframe');
        _setResultIframe.id = '__miGCJsBridgeIframe_setResult';
        _setResultIframe.style.display = 'none';
        document.documentElement.appendChild(_setResultIframe);

        _readyMsgIframe = document.createElement('iframe');
        _readyMsgIframe.id = '__miGCJsBridgeIframe';
        _readyMsgIframe.style.display = 'none';
        document.documentElement.appendChild(_readyMsgIframe);
        return _readyMsgIframe;
    };

    /**
     * @desc 将消息添加到发送队列里，iframe准备队列为：migamecenter://dispatch_message/
     * @param msg
     * @private
     */
    var _sendMsg = function(msg){
        if(!msg){
            return;
        }
        _sendMsgQueue.push(msg);
        _readyMsgIframe.src = _CUSTOM_PROTOCOL_SCHEME + '://' + _QUEUE_HAS_MESSAGE;
    };

    /**
     * @desc 取出队列里的消息，并将队列清空(需要Client起一个子线程取数据)
     * @returns {*}
     * @private
     */
    var _fetchQueue = function(){
        var msgQueueStr = JSON.stringify(_sendMsgQueue);
        _sendMsgQueue = [];
        _setResultValue('SCENE_FETCHQUEUE', msgQueueStr);
    };

    /**
     * @desc 执行完callback方法，将结果返回给客户端
     * @param scene
     * @param result
     * @private
     */
    var _setResultValue = function(scene, result) {
        if (result === undefined) {
            result = 'none';
        }
        _setResultIframe.src = _CUSTOM_PROTOCOL_SCHEME + '://private/setresult/' + scene + '&' + Base64.encode(result);
    };

    /**
     * @desc 调用客户端方法
     * @param func
     * @param params
     * @param callback
     * @param context
     * @private
     */
    var _call = function(func,params,callback,context) {
        if (!func || typeof func !== 'string') {
            return;
        }

        if (typeof params !== 'object') {
            params = {};
        }
        var callbackID = (_callbackCount++).toString();

        if (typeof callback === 'function') {
            _callbackMap[callbackID] = {
                cb: callback,
                ctx: context || this
            };
        }

        var msgObj = {'func':func,'params':params};
        msgObj[_MESSAGE_TYPE] = 'call';
        msgObj[_CALLBACK_ID] = callbackID;

        _sendMsg(msgObj);
    };

    /**
     * @desc 打印日志
     * @param str
     * @private
     */
    var _log = function(str){
        if(!str){
            return;
        }
        _call('android.showLog',str);
    };

    /**
     * @desc 绑定事件方法
     * @param e
     * @param next
     * @param context
     * @private
     */
    var _on = function(e,next,context){
        if (!e || typeof e !== 'string') {
            return;
        }

        if (typeof next !== 'function') {
            return;
        }
        _eventHookMap[e] = {
            cb:next,
            ctx:context || this
        };
    };

    /**
     * @desc 触发事件方法
     * @param e
     * @param argv
     * @private
     */
    var _emit = function(e,argv){
        var _eventHook = _eventHookMap[e];
        if (typeof _eventHook['cb'] !== 'function') {
            return;
        }
        _eventHook['cb'].apply(_eventHook['ctx'],[argv]);
    };

    /**
     * @desc Client 调用JS回调方法
     * @param msgStr 由客户端注入base64编码参数（主要解决乱码，字符量过多的问题）
     * @returns {*}
     * @private
     */
    var _handleMessageFromClient = function(msgStr) {

        if(!msgStr){
            return;
        }
        var ret,msg,callbackObj,eventHook;

        //将客户端传来的参数进行base64解码
        msg = JSON.parse(Base64.decode(msgStr));

        switch(msg[_MESSAGE_TYPE]){
            //普通调用，执行回调方法
            case 'callback':
                callbackObj = _callbackMap[msg[_CALLBACK_ID]];
                if(typeof msg[_CALLBACK_ID] === 'string' && typeof callbackObj['cb'] === 'function'){
                    ret = callbackObj['cb'].call(callbackObj['ctx'],msg['__params']);
                    delete _callbackMap[msg[_CALLBACK_ID]];
                    _setResultValue('SCENE_HANDLEMSGFROMCLIENT', JSON.stringify(ret));
                    return JSON.stringify(ret);
                }
                _setResultValue('SCENE_HANDLEMSGFROMCLIENT', JSON.stringify({'__err_code':'cb404'}));
                return JSON.stringify({'__err_code':'cb404'});
            //事件调用，调用事件句柄
            case 'event':
                eventHook = _eventHookMap[msg[_EVENT_ID]];
                if(typeof msg[_EVENT_ID] === 'string' && typeof eventHook['cb'] === 'function'){
                    ret = eventHook['cb'].call(eventHook['ctx'],msg['__params']);
                    _setResultValue('SCENE_HANDLEMSGFROMCLIENT', JSON.stringify(ret));
                    return JSON.stringify(ret);
                }
                _setResultValue('SCENE_HANDLEMSGFROMCLIENT', JSON.stringify({'__err_code':'ev404'}));
                return JSON.stringify({'__err_code':'ev404'});

            default:
                break;

        }
    };

    /**
     * @desc 用于添加系统环境属性;todo:现在暂时还没有用到，后续要用。
     * @param key
     * @returns {*}
     * @private
     */
    var _env = function(key) {
        return _sessionData[key];
    };





    /**
     * @desc todo://暂时测试用到了，后续需要native客户端来调用。
     * @private
     */
    var _init = function(){
        _emit('sys:init',{});
        _emit('sys:bridged',{});
    };

    /**
     * @desc 通知native，Web页的hash值有变化，可以执行相应操作
     * @private
     */
    var _hashChangeNotify = function () {
        if('onhashchange' in window){
            window.onhashchange = function(){
                _call('hashChange',{'hash':window.location.hash});
            };
        }
    };

    /**
     * @desc 下载集合中添加下载项
     * @param item
     * @param next
     * @param ctx
     * @private
     */
    var _pushItemInDownloadMap = function(item,next,ctx){
        if(!item || (!item.id)){
            return;
        }
        _downloadMap[item.id] = item;
        next && next.call(ctx||this);
    };

    /**
     * @desc 根据key值将下载集合中的某项去除
     * @param id
     * @param next
     * @param ctx
     * @private
     */
    var _shiftItemFromDownloadMap = function(id,next,ctx){
        if(!(id in _downloadMap)){
            return;
        }
        delete _downloadMap[id];
        next && next.call(ctx||this);
    };
    /**
     * @desc 获取客户端会话数据，包含基础数据
     * @returns {{}}
     * @private
     */
    var _getSessionData = function(){
        return _sessionData;
    };


    /**
     * @desc 初始化系统事件方法
     * @private
     */
    var _initialEventHandlers = function(){
        //绑定初始化事件，由native客户端加载完WebView来调用
        _on('sys:init',function(){
            if(window.JsBridge._hasInit){
                return;
            }
            window.JsBridge._hasInit = true;
            //window.JsBridge.version = e.version;
            //从客户端获得会话数据
            _call('get_session_data',{},function(data){
                _sessionData = data;
                //alert('jsbridge-->' + JSON.stringify(_sessionData));
                var readyEvent = document.createEvent('Events');
                readyEvent.initEvent('JsBridgeReady');
                document.dispatchEvent(readyEvent);
            });
            //var _session_data = e;
            //var readyEvent = document.createEvent('Events');
            //readyEvent.initEvent('JsBridgeReady');
            //document.dispatchEvent(readyEvent);
        });

        //桥接畅通事件，在初始化事件之后，由native客户端来调用
        _on('sys:bridged',function(){
            // 避免由于Java层多次发起init请求，造成网页端多次收到JSBridgeReady事件
            if (window.JsBridge._hasInit) {
                return;
            }
            _hashChangeNotify();
        });
        //下载事件
        _on('download_loading',function(params){
            var msgArr = params;
            if(!msgArr || (!msgArr.length)){
                return;
            }
            var msg,instance;
            for(var i= 0,len = msgArr.length;i<len;i++){
                msg = msgArr[i];
                instance = _downloadMap[msg.id];
                if(!instance){
                    break;
                }
                var ctx = instance.ctx || this;
                switch(msg.status){
                    case 'start':
                        instance.start && instance.start.call(ctx);
                        break;
                    case 'pause':
                        instance.pause && instance.pause.call(ctx);
                        break;
                    case 'wait':
                        instance.wait && instance.wait.call(ctx);
                        break;
                    case 'download_complete':
                        instance.downloadComplete && instance.downloadComplete.call(ctx);
                        break;
                    case 'install_complete':
                        instance.installComplete && instance.installComplete.call(ctx);
                        break;
                    case 'downloading':
                        instance.downloading && instance.downloading.call(ctx,msg.progress,msg.current_bytes);
                        break;
                    case 'remove':
                        instance.remove && instance.remove.call(ctx);
                        break;
                    case 'fail':
                        instance.fail && instance.fail.call(ctx);
                        break;
                    default:
                        instance.process && instance.process.call(ctx);
                        break;
                }
            }
        });

        //由客户端触发通知页面更新数据，用于在游戏中心按返回键回到上一个页面时候，通知页面。
        _on('sys:refresh',function(e){
            var refreshEvent = document.createEvent('Events');
            refreshEvent.initEvent('JsBridgeRefresh');
            document.dispatchEvent(refreshEvent);
        });

    };

    //JsBridge封装属性
    window.JsBridge = window.JsBridge || (function(){
        _createQueueReadyIframe();
        _initialEventHandlers();
        return {
            version:'1.0.1',
            invoke : _call,
            on : _on,
            env : _env,
            pushItemInDLMap : _pushItemInDownloadMap,
            shiftItemFrDLMap : _shiftItemFromDownloadMap,
            log : _log,
            _init : _init,
            _fetchQueue : _fetchQueue,
            _handleMessageFromClient : _handleMessageFromClient,
            getSessionData : _getSessionData,
            _hasInit : false
        };
    })();

})();