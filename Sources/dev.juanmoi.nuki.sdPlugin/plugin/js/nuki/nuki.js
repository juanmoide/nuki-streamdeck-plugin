var LockActionsEnum = Object.freeze(
    {
        "UNLOCK": 1,
        "LOCK": 2,
        "UNLATCH": 3,
        "LOCKNGO": 4,
        "LOCKNGO_UNLATCH": 5,
    });

function Bridge(bridgeId = null, ip = null, port = null, dateUpdated = null) {

    // Init Bridge
    var instance = this;

    this.requestToken = function(callback) {
        if(ip && port && ip !== "0.0.0.0" && port !== 0) {
            var url = "http://" + ip + ":" + port + "/auth";

            var xhr = new XMLHttpRequest();
            xhr.responseType = 'json';
            xhr.open('GET', url, true);
            xhr.timeout = 30000;

            xhr.onload = function() {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    if (xhr.response !== undefined && xhr.response != null) {
                        if (xhr.response.success) {
                            instance.token = xhr.response.token;
                            callback(true, "Token:", instance.token);
                        } else {
                            callback(false, "Token not granted by server timeout.");
                        }
                    }
                    else {
                        callback(false, 'Bridge response is undefined or null.');
                    }
                }
                else {
                    callback(false, 'Could not connect to the bridge.');
                }
            };

            xhr.onerror = function() {
                callback(false, 'Unable to connect to the internet.');
            };
        
            xhr.ontimeout = function() {
                callback(false, 'Connection to the internet timed out.');
            };
        
            xhr.send();
        } else {
            callback(false, "Port and IP are not provided.")
        }
    }

    // Public function to retrieve the username
    this.getBridgeId = function() {
        return bridgeId;
    };

    // Public function to retrieve the IP address
    this.getIP = function() {
        return ip;
    };

    // Public function to retrieve the ID
    this.getPort = function() {
        return port;
    };

    // Public function to retrieve the last date updated
    this.getDateUpdated = function() {
        return dateUpdated;
    };

    // Public function to retrieve token
    this.getToken = function() {
        return this.token || null;
    };
}

Bridge.discover = function (callback) {
    var url = "https://api.nuki.io/discover/bridges";

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('GET', url, true);
    xhr.timeout = 15000;

    xhr.onload = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            if (xhr.response !== undefined && xhr.response != null) {
                if (xhr.response.errorCode === 0) {
                    var bridges = xhr.response.bridges || [];

                    bridges = bridges.map(function(bridge) {
                        return new Bridge(bridge.bridgeId, bridge.ip, bridge.port, bridge.dateUpdated);
                    })

                    callback(true, bridges);
                } else {
                    callback(false, "Error code:", xhr.response.errorCode)
                }
            }
            else {
                callback(false, 'Nuki server response is undefined or null.');
            }
        }
        else {
            callback(false, 'Unable to discover bridges.');
        }
    };

    xhr.onerror = function() {
        callback(false, 'Unable to connect to the internet.');
    };

    xhr.ontimeout = function() {
        callback(false, 'Connection to the internet timed out.');
    };

    xhr.send();
}

function Device(bridge = undefined, deviceType = null, name = null, nukiId = null, firmwareVersion = null, lastKnownState = null) {

    // Init Lock
    var instance = this;

    this.requestLastState = function() {
        var url = "http://" + bridge.getIP() + ":" + "/lockState?nukiId=" + this.getNukiId() + "&deviceType=" + this.getDeviceType() + "&token=" + bridge.getToken();

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', url, true);
        xhr.timeout = 15000;

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                if (xhr.response !== undefined && xhr.response != null) {
                    lastKnownState = xhr.response || {};
                    callback(true, lastKnownState);
                }
                else {
                    callback(false, 'Nuki server response is undefined or null.');
                }
            }
            else {
                callback(false, 'Unable to discover bridges.');
            }
        };
    
        xhr.onerror = function() {
            callback(false, 'Unable to connect to the internet.');
        };
    
        xhr.ontimeout = function() {
            callback(false, 'Connection to the internet timed out.');
        };
    
        xhr.send();
    }

    // Public function to retrieve the bridge instance
    this.getBridge = function() {
        return bridge;
    };

    // Public function to retrieve the device type
    this.getDeviceType = function() {
        return deviceType;
    };

    // Public function to retrieve the Nuki device ID
    this.getNukiId = function() {
        return nukiId;
    };

    // Public function to retrieve the Nuki device ID
    this.getName = function() {
        return name;
    };

    // Public function to retrieve the firmware version
    this.getFirmware = function() {
        return firmwareVersion;
    };

    // Public function to retrieve the last known state
    this.getLastKnowState = function() {
        return lastKnownState;
    };
}

Device.discover = function(bridgeInstace, callback) {
    if (!bridgeInstace)
        throw new Error("Bridge not provided.")

    var url = "http://" + bridgeInstace.getIP() + ":" + bridgeInstace.getPort() + "/list?token=" + bridgeInstace.getToken();
    
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('GET', url, true);
    xhr.timeout = 15000;

    xhr.onload = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            if (xhr.response !== undefined && xhr.response != null) {
                var devices = xhr.response || [];

                devices = devices.map(function(device) {
                    if (device.deviceType === 0) {
                        return new Lock(bridgeInstace, device.name, device.nukiId, device.firmwareVersion, device.lastKnownState);
                    } else if (device.deviceType === 2) {
                        return new Opener(bridgeInstace, device.name, device.nukiId, device.firmwareVersion, device.lastKnownState)
                    } else {
                        return new Device(bridgeInstace, device.deviceType, device.name, device.nukiId, device.firmwareVersion, device.lastKnownState);
                    }
                });

                callback(true, devices);
            }
            else {
                callback(false, 'Nuki server response is undefined or null.');
            }
        }
        else {
            callback(false, 'Unable to discover bridges.');
        }
    };

    xhr.onerror = function() {
        callback(false, 'Unable to connect to the internet.');
    };

    xhr.ontimeout = function() {
        callback(false, 'Connection to the internet timed out.');
    };

    xhr.send();
}

function Lock(bridge, name, nukiId, firmwareVersion, lastKnownState) {
    Device.call(this, bridge, 0, name, nukiId, firmwareVersion, lastKnownState);

    this.unlock = function() { 
        var url = "http://" + bridge.getIP() + ":" + bridge.getPort() + "/lockAction?nukiId=" + this.getNukiId() + "&deviceType=0&action=1&token=" + bridge.getToken();

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', url, true);
        xhr.timeout = 3000;

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                if (xhr.response !== undefined && xhr.response != null) {
                    this.requestLastState();
                    callback(true, "Unlocked");
                }
                else {
                    callback(false, 'Nuki server response is undefined or null.');
                }
            }
            else {
                callback(false, 'Unable to discover bridges.');
            }
        };
    
        xhr.onerror = function() {
            callback(false, 'Unable to connect to the internet.');
        };
    
        xhr.ontimeout = function() {
            callback(false, 'Connection to the internet timed out.');
        };
    
        xhr.send();
    };

    this.lock = function() { 
        var url = "http://" + bridge.getIP() + ":" + bridge.getPort() + "/lockAction?nukiId=" + this.getNukiId() + "&deviceType=0&action=2&token=" + bridge.getToken();

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', url, true);
        xhr.timeout = 3000;

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                if (xhr.response !== undefined && xhr.response != null) {
                    this.requestLastState();
                    callback(true, "Locked");
                }
                else {
                    callback(false, 'Nuki server response is undefined or null.');
                }
            }
            else {
                callback(false, 'Unable to discover bridges.');
            }
        };
    
        xhr.onerror = function() {
            callback(false, 'Unable to connect to the internet.');
        };
    
        xhr.ontimeout = function() {
            callback(false, 'Connection to the internet timed out.');
        };
    
        xhr.send();
    };
}

function Opener(bridge, nukiId, firmwareVersion, lastKnownState) {
    Device.call(this, bridge, 2, nukiId, firmwareVersion, lastKnownState);

    this.open = function() {
        var url = "http://" + bridge.getIP() + ":" + bridge.getPort() + "/lockAction?nukiId=" + this.getNukiId() + "&deviceType=2&action=3&token=" + bridge.getToken();

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', url, true);
        xhr.timeout = 3000;

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                if (xhr.response !== undefined && xhr.response != null) {
                    this.requestLastState();
                    callback(true, "Opened");
                }
                else {
                    callback(false, 'Nuki server response is undefined or null.');
                }
            }
            else {
                callback(false, 'Unable to discover bridges.');
            }
        };
    
        xhr.onerror = function() {
            callback(false, 'Unable to connect to the internet.');
        };
    
        xhr.ontimeout = function() {
            callback(false, 'Connection to the internet timed out.');
        };
    
        xhr.send();
    };
}