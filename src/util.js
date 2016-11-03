'use strict';

module.exports = {
    /**
     * Copy values of object own properties to array.
     *
     * @param obj
     * @returns {Array}
     */
    copyObjectToArray: function(obj) {
        var ret = [];
        for (var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                ret.push(obj[prop]);
            }
        }
        return ret;
    },
    /**
     * Copy src properties to dst object.
     * Will overwrite dst prop with src prop in case of dst prop exist.
     */
    copyObjectPropsToAnotherObject: function(src, dst) {
        for (var prop in src) {
            if(src.hasOwnProperty(prop)) {
                dst[prop] = src[prop];
            }
        }
    },
    browser: function() {
        var browser;
        var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
        if (isAndroid)
            browser = "Android";
        var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isiOS)
            browser = "iOS";
        // Opera 8.0+
        var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        if (isOpera)
            browser = "Opera";
        // Firefox 1.0+
        var isFirefox = typeof InstallTrigger !== 'undefined';
        if (isFirefox)
            browser = "Firefox";
        // At least Safari 3+: "[object HTMLElementConstructor]"
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        if (isSafari)
            browser = "Safari";
        // Internet Explorer 6-11
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
        if (isIE)
            browser = "IE";
        // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;
        if (isEdge)
            browser = "Edge";
        // Chrome 1+
        var isChrome = !!window.chrome && !!window.chrome.webstore;
        if (isChrome)
            browser = "Chrome";
        return browser;
    },
    processGoogRtcStatsReport: function(report) {
        /**
         * Report types: googComponent, googCandidatePair, googCertificate, googLibjingleSession, googTrack, ssrc
         */
        var gotResult = false;
        var result = null;
        if (report.type && report.type == "googCandidatePair") {
            //check if this is active pair
            if (report.stat("googActiveConnection") == "true") {
                gotResult = true;
            }
        }

        if (report.type && report.type == "ssrc") {
            gotResult = true;
        }

        if (gotResult) {
            //prepare object
            result = {};
            result.timestamp = report.timestamp;
            result.id = report.id;
            result.type = report.type;
            if (report.names) {
                var names = report.names();
                for (var i = 0; i < names.length; ++i) {
                    var attrName = names[i];
                    result[attrName] = report.stat(attrName);
                }
            }
        }
        return result;
    },
    SDP: {
        matchPrefix: function(sdp,prefix) {
            var parts = sdp.trim().split('\n').map(function(line) {
                return line.trim();
            });
            return parts.filter(function(line) {
                return line.indexOf(prefix) === 0;
            });
        }
    },
    logger: {
        init: function (verbosity, enablePushLogs) {
            switch (verbosity.toUpperCase()) {
                case "DEBUG":
                    this.verbosity = 3;
                    break;
                case "INFO":
                    this.verbosity = 2;
                    break;
                case "ERROR":
                    this.verbosity = 0;
                    break;
                case "WARN":
                    this.verbosity = 1;
                    break;
                case "TRACE":
                    this.verbosity = 4;
                    break;
                default :
                    this.verbosity = 2;
            };
            this.date = function() {
                return new Date().toTimeString().split(" ")[0];
            };
            this.enablePushLogs = enablePushLogs;
            var delayedLogs = [];
            this.pushLogs = function(log) {
                if (this.wsConnection && this.enablePushLogs) {
                    if (delayedLogs.length) {
                        for (var i = 0; i<delayedLogs.length; i++) {
                            this.wsConnection.send(JSON.stringify({
                                message: "pushLogs",
                                data: [{logs: delayedLogs[i]}]
                            }));
                        }

                    }
                    delayedLogs = [];
                    this.wsConnection.send(JSON.stringify({
                        message: "pushLogs",
                        data: [{logs: log}]
                    }));
                } else {
                    // Save logs to send it later
                    delayedLogs.push(log);
                }
            }
        },
        info: function (src, text) {
            var prefix = this.date() + " INFO " + src + " - ";
            this.pushLogs(prefix + JSON.stringify(text) + '\n');
            if (this.verbosity >= 2)
                console.log(prefix,text);
        },
        debug: function (src, text) {
            var prefix = this.date() + " DEBUG " + src + " - ";
            this.pushLogs(prefix + JSON.stringify(text) + '\n');
            if (this.verbosity >= 3)
                console.log(prefix,text);
        },
        trace: function (src, text) {
            var prefix = this.date() + " TRACE " + src + " - ";
            this.pushLogs(prefix + JSON.stringify(text) + '\n');
            if (this.verbosity >= 4)
                console.log(prefix,text);
        },
        warn: function (src, text) {
            var prefix = this.date() + " WARN " + src + " - ";
            this.pushLogs(prefix + JSON.stringify(text) + '\n');
            if (this.verbosity >= 1)
                console.warn(prefix,text);
        },
        error: function (src, text) {
            var prefix = this.date() + " ERROR " + src + " - ";
            this.pushLogs(prefix + JSON.stringify(text) + '\n');
            if (this.verbosity >= 0)
                console.error(prefix,text);
        },
        setConnection: function(connection) {
            this.wsConnection = connection;

        }
    }

};